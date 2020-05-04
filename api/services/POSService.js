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
    redeemPoints,
    getNewCustomers
};

/**
 * Gets the profile of the customer. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getCustomerProfile(auth, entity) {
    if(!entity.hasOwnProperty('customerKey')) throw new errors.BadRequest('Customer Key is not defined');
    let userKey = entity.customerKey;
    // userId = Buffer.from(userId, 'base64').toString('ascii');
    // userId = Buffer.from(userId, 'base64').toString('ascii');
    // var n = userId.indexOf(' ');
    // userId = userId.substring(n != -1 ? n+1 : userId.length, userId.length);
    var customer = yield Customer.findOne({ where: { customerKey: userKey } });
    if (!customer) {
        throw new errors.NotFound('Customer not found with specified id');
    }
    customer["birthday"] = customer["birthday"] != null ? moment.utc(customer["birthday"]).format('YYYY-MM-DD') : null;
    customer = _.omit(customer.toJSON(), 'password', 'resetPasswordToken');
    let pointSummary = yield db.rerieveCustomerPointSummary(userKey);
    customer.availablePoints = pointSummary.totalEarnings - pointSummary.totalRedeems;
    //let test = Buffer.from(`id: ${userId}`).toString('base64');
    //test = Buffer.from(test).toString('base64');
    // console.log(test);
    // console.log(Buffer.from(test, 'base64').toString('ascii'))
    return customer;
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
                entity.customerKey = entity.customerKey;
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
                entity.points = customerRole.role == '' ? Math.floor(entity.transactionAmount / 200) : 0;
                entity.transactionType = "credit";
                entity.status = "approved";
                entity.createdAt = entity.transactionDate;
                yield CustomerTransaction.create(entity, { transaction: t });
                // record transaction items
                if(entity.transactionItems.length > 0) {
                    let items = entity.transactionItems.map(v => ({...v, "referenceNumber": entity.referenceNumber, "createdAt": moment().format('YYYY-MM-DD HH:mm:ss').toString()}));
                    yield TransactionItems.bulkCreate(items);
                }
                let pointSummary = yield db.rerieveCustomerPointSummary(customer.customerKey);
                let availablePoints = 0;
                availablePoints = pointSummary.totalEarnings + entity.points - pointSummary.totalRedeems;
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
                if(transaction.transactionAmount > entity.transactionAmount) {
                    throw new errors.NotFound('New transaction amount should be higher from the previous transaction.');
                };
                if (!transaction) {
                    throw new errors.NotFound('Transaction not found with specified id');
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