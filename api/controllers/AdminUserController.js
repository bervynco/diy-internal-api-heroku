'use strict';

const co = require('co');
const AdminUserService = require('../services/AdminUserService');

module.exports = {
    getAllUsers,
    getAllCustomers,
    getCustomerTransactions,
    deleteUser,
    // updateUserDetail,
    // getUserActivities,
    addUser,
    addPOSUser,
    getAllTodayTransactions,
    getCustomerById,
    updateCustomerRole,
    updateUserRole
};

/**
 * Get all the users
 *
 * @param req the request
 * @param res the response
 */
function getAllUsers(req, res, next) {
    co(function* () {
        res.json(yield AdminUserService.getAllUsers(req.auth, req.swagger.params));
    }).catch(next);
}

/**
 * Get all the customers
 *
 * @param req the request
 * @param res the response
 */
function getAllCustomers(req, res, next) {
    co(function* () {
        res.json(yield AdminUserService.getAllCustomers(req.auth, req.swagger.params));
    }).catch(next);
}

/**
 * Get all transactions of the customer.
 *
 * @param req the request
 * @param res the response
 */
function getCustomerTransactions(req, res, next) {
    co(function* () {
        res.json(yield AdminUserService.getCustomerTransactions(req.auth, req.swagger.params.id.value));
    }).catch(next);
}

/**
* Add a user
*
* @param req the request
* @param res the response
*/
function addUser(req, res, next) {
    co(function* () {
        res.json(yield AdminUserService.addUser(req.auth, req.body));
    }).catch(next);
}

/**
* POST /users/pos
* Add a POS user
*
* @param req the request
* @param res the response
*/
function addPOSUser(req, res, next) {
    co(function* () {
        res.json(yield AdminUserService.addPOSUser(req.auth, req.body));
    }).catch(next);
}

/**
 * Delete an admin user identified by unique id
 *
 * @param req the request
 * @param res the response
 */
function deleteUser(req, res, next) {
    co(function* () {
        res.json(yield AdminUserService.deleteUser(req.auth, req.swagger.params.id.value));
    }).catch(next);
}

/**
 * GET /users/customers/transactions
 * Returns all the transactions done for the day. non-anonymous
 *
 * @param req the request
 * @param res the response
 */
function getAllTodayTransactions(req, res, next) {
    co(function* () {
        res.json(yield AdminUserService.getAllTodayTransactions(req.auth, req.swagger.params));
    }).catch(next);
}

/**
 * GET /users/customers/{id}
 * Gets the details of the customer. non-anonymous
 *
 * @param req the request
 * @param res the response
 */
function getCustomerById(req, res, next) {
    co(function* () {
        res.json(yield AdminUserService.getCustomerById(req.auth, req.swagger.params.id.value));
    }).catch(next);
}

/**
 * POST /users/customers/role
 * Update a customer's role, non-anonymous
 *
 * @param req the request
 * @param res the response
 */
function updateCustomerRole(req, res, next) {
    co(function* () {
        res.json(yield AdminUserService.updateCustomerRole(req.auth, req.swagger.params, req.body));
    }).catch(next);
}

/**
 * POST /users/role
 * Update a user's role, non-anonymous
 *
 * @param req the request
 * @param res the response
 */
function updateUserRole(req, res, next) {
    co(function* () {
        res.json(yield AdminUserService.updateUserRole(req.auth, req.swagger.params, req.body));
    }).catch(next);
}