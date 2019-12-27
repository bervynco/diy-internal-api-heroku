'use strict';

const co = require('co');
const AdminUserService = require('../services/AdminUserService');

module.exports = {
    getAllUsers,
    getAllCustomers,
    getCustomerTransactions,
    getCustomerProfile,
    deleteUser,
    addTransactionRecord,
    // updateUserDetail,
    // getUserActivities,
    addUser,
    addPOSUser,
    redeemPoints
    // bulkDeleteAdminUsers
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
* POST /customer/redeem
* Redeems the points of the customer. non-anonymous
*
* @param req the request
* @param res the response
*/
function redeemPoints(req, res, next) {
    co(function* () {
        res.json(yield AdminUserService.redeemPoints(req.auth, req.swagger.params, req.body));
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
 * Gets the profile of the customer. non-anonymous
 *
 * @param req the request
 * @param res the response
 */
function getCustomerProfile(req, res, next) {
    co(function* () {
        console.log(req.body)
        res.json(yield AdminUserService.getCustomerProfile(req.auth, req.body));
    }).catch(next);
}

/**
 * POST /customers/earn
 * Logs the transaction history of the user. non-anonymous
 *
 * @param req the request
 * @param res the response
 * @param next the next step in the middleware flow
 */
function addTransactionRecord(req, res, next) {
    co(function* () {
        res.json(yield AdminUserService.addTransactionRecord(req.auth, req.swagger.params, req.body));
    }).catch(next);
}