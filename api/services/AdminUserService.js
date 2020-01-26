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

module.exports = {
    getAllUsers,
    getAllCustomers,
    getCustomerProfile,
    getCustomerBalance,
    getCustomerTransactions,
    addUser,
    deleteUser,
    addTransactionRecord,
    returnTransaction,
    addPOSUser,
    redeemPoints
};

/**
 * Get all the app users.
 * Filtering will be applied based on the filter criteria specified by the client
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getAllUsers(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    let users = yield db.retrieveUsers();
    return users;
}

/**
 * Get all the customers.
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getAllCustomers(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    var customers = yield Customer.findAll();
    for (let i = 0; i < customers.length; i++) {
        customers[i]["birthday"] = moment.utc(customers[i]["birthday"]).format('YYYY-MM-DD');
        customers[i] = _.omit(customers[i].toJSON(), 'password', 'resetPasswordToken');
    };
    console.log(customers)
    return customers;
}

/**
 * Gets the profile of the customer. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getCustomerProfile(auth, entity) {
    entity = JSON.parse(entity);
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
    entity = JSON.parse(entity);
    let userKey = entity.customerKey;
    var customer = yield Customer.findOne({ where: { customerKey: userKey } });
    if (!customer) {
        throw new errors.NotFound('Customer not found with specified id');
    }
    let pointSummary = yield db.rerieveCustomerPointSummary(userKey);
    let availablePoints = 0;
    availablePoints = pointSummary.totalEarnings - pointSummary.totalRedeems;
    return availablePoints;
}

/**
 * Logs the transaction history of the user. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* addTransactionRecord(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    return sequelize
        .transaction(
            {
                isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
            },
            co.wrap(function* (t) {
                entity = JSON.parse(entity);
                entity.customerKey = entity.customerKey;
                let userId = auth.userId;
                const pos = yield POSUser.findByPk(userId);
                var customer = yield Customer.findOne({ where: { customerKey: entity.customerKey } });
                if (!customer) {
                    throw new errors.NotFound('Customer not found with specified id');
                }
                let expirationDate = moment(entity.transactionDate).add(2, 'd');
                if (moment().isAfter(expirationDate))
                    throw new errors.BadRequest('Transaction expired.');
                entity.branchId = pos.branchId;
                entity.points = Math.floor(entity.transactionAmount / 200);
                entity.transactionType = "credit";
                entity.status = "approved";
                entity.createdAt = entity.transactionDate;
                yield CustomerTransaction.create(entity, { transaction: t });
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
                entity = JSON.parse(entity);
                entity.customerKey = entity.customerKey;
                let userId = auth.userId;
                const pos = yield POSUser.findByPk(userId);
                var transaction = yield CustomerTransaction.findOne({ where: { customerKey: entity.customerKey, 
                    referenceNumber: entity.referenceNumber } });
                if(transaction.transactionAmount > entity.transactionAmount) {
                    throw new errors.NotFound('New transaction amount should be higher from the previous transaction.');
                };
                if (!transaction) {
                    throw new errors.NotFound('Transaction not found with specified id');
                };
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
                entity = JSON.parse(entity);
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
                record.points = pointSummary.totalEarnings - pointSummary.totalRedeems;
                record.transactionType = "debit";
                record.transactionAmount = record.points;
                record.status = "approved";
                yield CustomerTransaction.create(record, { transaction: t });
            })
        )
        .catch(function (err) {
            throw err;
        });
}

/**
 * Find a customer by id.
 * If customer is not found throw NotFound
 *
 * @param   {Number}    id            the customer id
 */
function* findCustomerById(id) {
    const customer = yield Customer.findByPk(id);

    if (!customer) {
        throw new errors.NotFound('Customer not found with specified id');
    }

    return customer;
};

/**
 * Add a user.
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    entity        the request payload from client
 */
function* addUser(auth, entity) {
    return sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    }, co.wrap(function* (t) {
        const email = entity.email;
        const existing = yield User.count({
            where: { email: email }
        });
        if (existing != 0)
            throw new errors.BadRequest('User with email address already exists');

        // entity = _.omit(entity, 'privileges');
        entity.password = yield utils.hashString(entity.password, 4);
        entity.createdBy = auth.userId;
        entity.updatedBy = auth.userId;
        entity.status = 'active';
        const created = yield User.create(entity, { transaction: t });

        yield UserRole.create({ userId: created.id, role: config.roles.STANDARD_USER, createdBy: 'system', updatedBy: 'system' }, { transaction: t });
        return created;
    })).catch(function (err) {
        throw err;
    });
}

/**
 * Add a POS user. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    entity        the request payload from client
 */
function* addPOSUser(auth, entity) {
    return sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    }, co.wrap(function* (t) {
        const username = entity.username;
        const existing = yield POSUser.count({
            where: { username: username }
        });
        if (existing != 0)
            throw new errors.BadRequest('User with username already exists.');

        entity.password = yield utils.hashString(entity.password, 4);
        entity.createdBy = auth.userId;
        entity.updatedBy = auth.userId;
        const created = yield POSUser.create(entity, { transaction: t });
        return created;
    })).catch(function (err) {
        throw err;
    });
}

/**
 * Delete an admin user.
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Number}    id            the user id
 */
function* deleteUser(auth, id) {
    const user = yield User.findByPk(id);
    user.status = 'in-active';
    yield user.save();
}

/**
 * Get all transactions of the customer.
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getCustomerTransactions(auth, id, entity) {
    var user = yield Customer.findByPk(id);
    if (!user) {
        throw new errors.NotFound('User not found');
    }
    var transactions = yield CustomerTransaction.findAll({
        where: { customerId: id },
        order: [['createdAt', 'ASC']]
    });

    return transactions;
}