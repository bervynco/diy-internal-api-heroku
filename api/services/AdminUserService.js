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
const UserRole = models.UserRole;
const Customer = models.Customer;
const CustomerTransaction = models.CustomerTransaction;

module.exports = {
    getAllUsers,
    getAllCustomers,
    getCustomerTransactions,
    addUser,
    deleteUser
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