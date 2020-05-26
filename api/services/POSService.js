'use strict';

const errors = require('../helpers/errors');
const utils = require('../helpers/utils');
const db = require('../helpers/db');
const models = require('../models');
const config = require('config');

const _ = require('lodash');
const co = require('co');
const moment = require('moment');

const sequelize = models.sequelize;
const Sequelize = models.Sequelize;

const User = models.User;
const POSUser = models.POSUser;
const UserRole = models.UserRole;
const Customer = models.Customer;
const CustomerTransaction = models.CustomerTransaction;
const CustomerRole = models.CustomerRole;
const TransactionItems = models.TransactionItems;

module.exports = {
    getCustomerProfile,
    getCustomerBalance,
    earnPoints,
    returnTransaction,
    voidTransaction,
    redeemPoints,
    getNewCustomers,
    reconciliation
};

/**
 * Gets the profile of the customer. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getCustomerProfile(auth, entity) {
    if(!entity.hasOwnProperty('customerKey')) throw new errors.BadRequest('Customer Key is not defined');
    let customerKey = entity.customerKey;
    let customer = yield db.retrieveCustomerDetails(customerKey);
    let result = {};

    if (customer.length == 0) {
        throw new errors.NotFound('Customer not found with specified id');
    }
    result = {
        id: customer[0].customer_id,
        customerKey: customerKey,
        firstName: customer[0].first_name,
        lastName: customer[0].last_name,
        email: customer[0].email,
        gender: customer[0].gender,
        isActive: customer[0].is_active !=0 ? true : false,
        city: customer[0].city,
        birthday: customer[0]["birthday"] != null ? moment.utc(customer[0]["birthday"]).format('YYYY-MM-DD') : null,
        contactNumber: customer[0].contact_number,
        role: customer[0].role,
        roleName: customer[0].role_name,
        createdAt: customer[0].created_at,
        updatedAt: customer[0].updated_at
    }
    
    let pointSummary = yield db.rerieveCustomerPointSummary(customerKey);
    result.availablePoints = pointSummary.totalEarnings - pointSummary.totalRedeems;
    return result;
}

/**
 * Gets the available points of a customer. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getCustomerBalance(auth, entity) {
    if(!entity.hasOwnProperty('customerKey')) throw new errors.BadRequest('Customer Key is not defined');
    let userKey = entity.customerKey;
    var customer = yield Customer.findOne({ where: { customerKey: userKey } });
    if (!customer) {
        throw new errors.NotFound('Customer not found with specified id');
    }
    let pointSummary = yield db.rerieveCustomerPointSummary(userKey);
    let availablePoints = 0;
    availablePoints = pointSummary.totalEarnings - pointSummary.totalRedeems;
    return { balance: availablePoints };
}

/**
 * Logs the transaction history of the user. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* earnPoints(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    return yield sequelize
        .transaction(
            {
                isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
            },
            co.wrap(function* (t) {
                if(!entity.hasOwnProperty('customerKey') && entity.hasOwnProperty('transactionDate') && entity.hasOwnProperty('transactionAmount') && !entity.hasOwnProperty('redeemPoints') && entity.hasOwnProperty('transactionItems')) 
                    throw new errors.BadRequest('Invalid input');
                let userId = auth.userId;
                const pos = yield POSUser.findByPk(userId);
                var customer = yield Customer.findOne({ where: { customerKey: entity.customerKey } });
                if (!customer) {
                    throw new errors.NotFound('Customer not found with specified id');
                }
                var customerRole = yield CustomerRole.findOne({ where: { customerId: customer.id } })
                let expirationDate = moment(entity.transactionDate).add(2, 'd');
                if (moment().isAfter(expirationDate))
                    throw new errors.BadRequest('Transaction expired.');
                entity.branchId = pos.branchId;
                //FOR RETURN
                if(entity.oldReferenceNumber != '') {
                    var oldTransaction = yield db.retrieveTransactionItems(entity.customerKey, entity.oldReferenceNumber, 'active');
                    if (oldTransaction.length == 0) {
                        throw new errors.NotFound('Transaction not found with specified id');
                    };
                    let returnedTotalPrice = 0;
                    for (let i = 0; i < entity.oldTransactionItems.length; i++) {
                        let originalRecord = oldTransaction.find(item => {return item.item_code === entity.oldTransactionItems[i].itemCode});
                        if(originalRecord != undefined) {
                            returnedTotalPrice += parseFloat(entity.oldTransactionItems[i].itemTotalPrice);
                            if(originalRecord.item_quantity > entity.oldTransactionItems[i].itemQuantity) {
                                yield TransactionItems.update({
                                    itemQuantity: entity.oldTransactionItems[i].itemQuantity,
                                    itemTotalPrice: entity.oldTransactionItems[i].itemTotalPrice,
                                    status: 'returned'}, { 
                                    where: { 
                                        referenceNumber: entity.oldReferenceNumber,
                                        itemCode: entity.oldTransactionItems[i].itemCode
                                    }
                                });
                                let remainingQuantity = originalRecord.item_quantity - entity.oldTransactionItems[i].itemQuantity;
                                let newTotalPrice = (originalRecord.item_total_price / originalRecord.item_quantity) * remainingQuantity;
                                yield TransactionItems.create({
                                    referenceNumber: entity.oldReferenceNumber,
                                    itemCode: entity.oldTransactionItems[i].itemCode,
                                    itemDescription: entity.oldTransactionItems[i].itemDescription,
                                    itemQuantity: remainingQuantity,
                                    itemTotalPrice: newTotalPrice,
                                    status: "active"
                                });
                            } else {
                                yield TransactionItems.update({
                                    status: 'returned'}, { 
                                    where: { 
                                        referenceNumber: entity.oldReferenceNumber,
                                        itemCode: entity.transactionItems[i].itemCode
                                    }
                                });
                            }
                        }
                    }
                    let newAmount = oldTransaction[0].transaction_amount - returnedTotalPrice;
                    yield CustomerTransaction.update({
                        transactionAmount: newAmount,
                        points: customerRole.role == '' ? Math.floor(newAmount / 200) : 0}, { 
                        where: { 
                            referenceNumber: entity.oldReferenceNumber,
                            customerKey: entity.customerKey
                        }}
                    );
                }
                //FOR EARN
                yield CustomerTransaction.create({
                    customerKey: entity.customerKey,
                    branchId: pos.branchId,
                    transactionAmount: entity.transactionAmount,
                    points: customerRole.role == '' ? Math.floor(entity.transactionAmount / 200) : 0,
                    transactionType: "credit",
                    status: "approved",
                    referenceNumber: entity.referenceNumber
                });
                // record transaction items
                let date = moment().format('YYYY-MM-DD HH:mm:ss').toString();
                if(entity.transactionItems.length > 0) {
                    let items = entity.transactionItems.map(v => ({...v, "referenceNumber": entity.referenceNumber, "status": "active", "createdAt": date, "updatedAt": date}));
                    yield TransactionItems.bulkCreate(items);
                }

                let pointSummary = yield db.rerieveCustomerPointSummary(entity.customerKey);
                let availablePoints = 0;
                availablePoints = pointSummary.totalEarnings - pointSummary.totalRedeems;
                //redeem
                if(entity.redeemPoints > 0) {
                    let record = {};
                    record.customerKey = entity.customerKey;
                    record.branchId = pos.branchId;
                    record.points = entity.redeemPoints;
                    record.transactionType = "debit";
                    if(entity.redeemPoints > availablePoints)
                        throw new errors.BadRequest('Redeem points is higher than the available balance.');
                    record.transactionAmount = record.points;
                    record.status = "approved";
                    yield CustomerTransaction.create(record, { transaction: t });
                    availablePoints =  availablePoints - entity.redeemPoints;
                }
                return { availablePoints: availablePoints };
            })
        )
        .catch(function (err) {
            throw err;
        });
}


/**
 * Updates the transaction amount of the customer. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* returnTransaction(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    return sequelize
        .transaction(
            {
                isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
            },
            co.wrap(function* (t) {
                if(!entity.hasOwnProperty('customerKey')) throw new errors.BadRequest('Customer Key is not defined');
                if(entity.hasOwnProperty('transactionDate') && entity.hasOwnProperty('transactionAmount') && !entity.hasOwnProperty('redeemPoints') && entity.hasOwnProperty('transactionItems') && entity.hasOwnProperty('newReferenceNumber') && entity.hasOwnProperty('newTransactionItems')) 
                    throw new errors.BadRequest('Invalid input');
                entity.customerKey = entity.customerKey;
                let userId = auth.userId;
                const pos = yield POSUser.findByPk(userId);
                var customer = yield Customer.findOne({ where: { customerKey: entity.customerKey } });
                if (!customer) {
                    throw new errors.NotFound('Customer not found with specified id');
                }
                var transaction = yield CustomerTransaction.findOne({ 
                    where: { customerKey: entity.customerKey, 
                    referenceNumber: entity.referenceNumber } 
                });
                if (!transaction) {
                    throw new errors.NotFound('Transaction not found with specified id');
                };
                for (let i = 0; i < entity.transactionItems.length; i++) {
                    yield TransactionItems.update({
                        status: 'returned'}, { 
                        where: { 
                            referenceNumber: entity.referenceNumber,
                            itemCode: entity.transactionItems[i]
                        },
                        individualHooks: true }
                    );
                }
                
                if(transaction.transactionAmount > entity.transactionAmount) {
                    throw new errors.NotFound('New transaction amount should be higher from the previous transaction.');
                };
                transaction.transactionAmount = entity.transactionAmount;
                transaction.points = Math.floor(entity.transactionAmount / 200);
                transaction.transactionType = "credit";
                transaction.status = "approved";
                transaction.createdAt = entity.transactionDate;
                yield transaction.save({ transaction: t });
            })
        )
        .catch(function (err) {
            throw err;
        });
}

/**
 * Void the transaction of the customer. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* voidTransaction(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    return yield sequelize
        .transaction(
            {
                isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
            },
            co.wrap(function* (t) {
                if(!entity.hasOwnProperty('customerKey') && entity.hasOwnProperty('transactionDate') && entity.hasOwnProperty('transactionAmount') && !entity.hasOwnProperty('redeemPoints') && entity.hasOwnProperty('transactionItems')) 
                    throw new errors.BadRequest('Invalid input');
                entity.customerKey = entity.customerKey;
                let userId = auth.userId;
                const pos = yield POSUser.findByPk(userId);
                var customer = yield Customer.findOne({ where: { customerKey: entity.customerKey } });
                if (!customer) {
                    throw new errors.NotFound('Customer not found with specified id');
                }
                var transaction = yield CustomerTransaction.findOne({ 
                    where: { customerKey: entity.customerKey, 
                    referenceNumber: entity.referenceNumber } 
                });
                if (!transaction) {
                    throw new errors.NotFound('Transaction not found with specified id');
                };
                yield TransactionItems.update({
                    status: 'void'}, { 
                    where: { referenceNumber: entity.referenceNumber },
                    individualHooks: true }
                );
                yield CustomerTransaction.update(
                    { status: 'declined' }, 
                    { where: { customerKey: entity.customerKey, 
                        referenceNumber: entity.referenceNumber }
                });
                let pointSummary = yield db.rerieveCustomerPointSummary(customer.customerKey);
                return { availablePoints: pointSummary.totalEarnings - pointSummary.totalRedeems};
            })
        )
        .catch(function (err) {
            throw err;
        });
}

/**
 * Add transactions that is not listed within the day. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* reconciliation(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    return yield sequelize
        .transaction(
            {
                isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
            },
            co.wrap(function* (t) {
                let userId = auth.userId;
                const pos = yield POSUser.findByPk(userId);
                for (let i = 0; i < entity.length; i++) {
                    var customer = yield Customer.findOne({ where: { customerKey: entity[i].customerKey } });
                    if (!customer) {
                        throw new errors.NotFound('Customer not found with specified id');
                    }
                    var customerRole = yield CustomerRole.findOne({ where: { customerId: customer.id } })
                    let expirationDate = moment(entity[i].transactionDate).add(2, 'd');
                    if (moment().isAfter(expirationDate))
                        throw new errors.BadRequest('Transaction expired.');
                    entity[i].branchId = pos.branchId;
                    entity[i].points = customerRole.role == '' ? Math.floor(entity[i].transactionAmount / 200) : 0;
                    entity[i].transactionType = "credit";
                    entity[i].status = "approved";
                    entity[i].createdAt = entity[i].transactionDate;
                    yield CustomerTransaction.create(entity[i], { transaction: t });
                    // record transaction items
                    let date = moment().format('YYYY-MM-DD HH:mm:ss').toString();
                    if(entity[i].transactionItems.length > 0) {
                        let items = entity[i].transactionItems.map(v => ({...v, "referenceNumber": entity[i].referenceNumber, "status": "active", "createdAt": date, "updatedAt": date}));
                        yield TransactionItems.bulkCreate(items);
                    }
                    let pointSummary = yield db.rerieveCustomerPointSummary(customer.customerKey);
                    let availablePoints = 0;
                    availablePoints = pointSummary.totalEarnings + entity.points - pointSummary.totalRedeems;
                    //redeem
                    if(entity[i].redeemPoints > 0) {
                        let record = {};
                        record.customerKey = entity[i].customerKey;
                        record.branchId = pos.branchId;
                        record.points = entity[i].redeemPoints;
                        record.transactionType = "debit";
                        if(entity[i].redeemPoints > availablePoints)
                            throw new errors.BadRequest('Redeem points is higher than the available balance.');
                        record.transactionAmount = record.points;
                        record.status = "approved";
                        yield CustomerTransaction.create(record, { transaction: t });
                        availablePoints =  availablePoints - entity[i].redeemPoints;
                    }
                }
            })
        )
        .catch(function (err) {
            throw err;
        });
}

/**
 * Redeems the points of the customer. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* redeemPoints(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    return sequelize
        .transaction(
            {
                isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
            },
            co.wrap(function* (t) {
                if(!entity.hasOwnProperty('customerKey')) throw new errors.BadRequest('Customer Key is not defined');
                if(!entity.hasOwnProperty('redeemPoints')) throw new errors.BadRequest('Redeem Points is not defined');
                let record = {};
                record.customerKey = entity.customerKey;
                let userId = auth.userId;
                const pos = yield POSUser.findByPk(userId);
                var customer = yield Customer.findOne({ where: { customerKey: record.customerKey } });
                if (!customer) {
                    throw new errors.NotFound('Customer not found with specified id');
                }
                record.branchId = pos.branchId;
                let pointSummary = yield db.rerieveCustomerPointSummary(record.customerKey);
                console.log(pointSummary)
                let availablePoints = 0;
                availablePoints = pointSummary.totalEarnings - pointSummary.totalRedeems;
                console.log(availablePoints);
                record.points = entity.redeemPoints;
                record.transactionType = "debit";
                if(entity.redeemPoints > availablePoints) 
                    throw new errors.BadRequest('Redeem points is higher than the available balance.');
                record.transactionAmount = record.points;
                record.status = "approved";
                yield CustomerTransaction.create(record, { transaction: t });
                return { availablePoints: availablePoints - record.points };
            })
        )
        .catch(function (err) {
            throw err;
        });
}

/**
 * Gets the list of all customers registered yesterday. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getNewCustomers(auth, params, entity) {
    return sequelize
        .transaction(
            {
                isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
            },
            co.wrap(function* (t) {
                let userId = auth.userId;
                let pos = yield POSUser.findByPk(userId);
                if(moment(pos.lastSyncedAt).utc().format('MM-DD-YY') == moment().format('MM-DD-YY'))
                    throw new errors.BadRequest('POS already requested the new members for today.');
                let newCustomers = yield db.rerieveNewCustomers(pos.lastSyncedAt);
                pos.lastSyncedAt = moment().format('YYYY-MM-DD HH:mm:ss');
                yield pos.save({ transaction: t });
                console.log(newCustomers);
                return newCustomers;
            })
        )
        .catch(function (err) {
            throw err;
        });
}