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

module.exports = {
    getAllUsers,
    getAllCustomers,
    getCustomerTransactions,
    addUser,
    deleteUser,
    addPOSUser,
    getAllTodayTransactions,
    getCustomerById,
    updateCustomerRole,
    updateUserRole
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
    var customers = yield db.retrieveCustomerDetails();
    let result = [];
    for (let i = 0; i < customers.length; i++) {
        result.push({
            id: customers[i].customer_id,
            customerKey: customers[i].customer_key,
            firstName: customers[i].first_name,
            lastName: customers[i].last_name,
            email: customers[i].email,
            gender: customers[i].gender,
            isActive: customers[i].is_active !=0 ? true : false,
            city: customers[i].city,
            birthday: customers[i]["birthday"] != null ? moment.utc(customers[i]["birthday"]).format('YYYY-MM-DD') : null,
            contactNumber: customers[0].contact_number,
            role: customers[i].role,
            roleName: customers[i].role_name,
            createdAt: customers[i].created_at,
            updatedAt: customers[i].updated_at
        })
    };
    console.log(result)
    return result;
}

/**
 * Find a customer by id.
 * If customer is not found throw NotFound
 *
 * @param   {Number}    id            the customer id
 */
function* getCustomerById(auth, id) {
    console.log(id)
    let customer = yield Customer.findOne({
        where: { customerKey: id }
    });

    if (!customer) {
        throw new errors.NotFound('Customer not found with specified id');
    }

    customer =  _.omit(customer.toJSON(), 'password', 'resetPasswordToken');
    let addInfo = yield db.rerieveCustomerPointSummary(id);
    customer.visitCounts = addInfo.visitCounts;
    customer.totalTransactionAmount = addInfo.totalTransactionAmount;
    customer.totalRedeemedPoints = addInfo.totalRedeems;
    customer.balance = addInfo.totalEarnings - addInfo.totalRedeems;

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
    var user = yield Customer.findOne({
        where: { customerKey: id }
    });
    if (!user) {
        throw new errors.NotFound('User not found');
    }
    var transactions = yield CustomerTransaction.findAll({
        where: { customerKey: id },
        order: [['createdAt', 'ASC']]
    });
    let result = [];
    for (let i = 0; i < transactions.length; i++) {
        result.push({
            id: transactions[i].id,
            customerKey: transactions[i].customerKey,
            wallet: transactions[i].wallet,
            transactionType: transactions[i].transactionType,
            points: transactions[i].points,
            amount: transactions[i].transactionAmount,
            description: transactions[i].description,
            status: transactions[i].status,
            expirationDate: transactions[i].expirationDate,
            createdAt: transactions[i].createdAt,
            updatedAt: transactions[i].updatedAt
        })
    };
    return result;
}

/**
 * Get all the customers.
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getAllTodayTransactions(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    let customerTransactions = yield db.retrieveTodayTransactions();

    let result = [];
    for (let i = 0; i < customerTransactions.length; i++) {
        result.push({
            id: customerTransactions[i].ct_id,
            customerKey: customerTransactions[i].customer_key,
            wallet: customerTransactions[i].wallet,
            transactionType: customerTransactions[i].transaction_type,
            amount: customerTransactions[i].transaction_amount,
            description: customerTransactions[i].description,
            status: customerTransactions[i].status,
            expirationDate: customerTransactions[i].expiration_date,
            createdAt: customerTransactions[i].created_at,
            updatedAt: customerTransactions[i].updated_at
        });
    };

    return result;
}

/**
 * POST /users/customers/role
 * Update a customer's role, non-anonymous
 *
 * @param auth the authorized user
 * @param params the parameters for the method
 */
function* updateCustomerRole(auth, params, entity) {
    params = _.mapValues(params, function (v) { return v.value; });
    return sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    }, co.wrap(function* (t) {
        const customerKey = entity.customerKey;
        var customer = yield Customer.findOne({
            where: { customerKey: customerKey }
        });
        if (!customer)
            throw new errors.BadRequest('Customer not found');
        var role = yield CustomerRole.findOne({
            where: { customerId: customer.id}
        })
        role.role = entity.role;
        role.roleName = entity.roleName;
        role.updatedBy = auth.userId;
        yield role.save({ transaction: t });
    })).catch(function (err) {
        throw err;
    });
}

/**
 * POST /users/role
 * Update a user's role, non-anonymous
 *
 * @param auth the authorized user
 * @param params the parameters for the method
 */
function* updateUserRole(auth, params, entity) {
    params = _.mapValues(params, function (v) { return v.value; });
    return sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    }, co.wrap(function* (t) {
        let user = yield db.checkUserAdminBranch(entity.id, auth.userId);
        if(!user)
            throw new errors.BadRequest('User not allowed to modify');
        var role = yield UserRole.findOne({
            where: { userId: entity.id }
        });
        if (!role)
            throw new errors.BadRequest('User not found');
        role.role = entity.role;
        role.updatedBy = auth.userId;
        yield role.save({ transaction: t });
    })).catch(function (err) {
        throw err;
    });
}