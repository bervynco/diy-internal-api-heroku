'use strict';

const co = require('co');
const POSService = require('../services/POSService');

module.exports = {
    getCustomerProfile,
    getCustomerBalance,
    earnPoints,
    returnTransaction,
    redeemPoints,
    getNewCustomers,
    voidTransaction,
    reconciliation
};

/**
 * Gets the profile of the customer. non-anonymous
 *
 * @param req the request
 * @param res the response
 */
function getCustomerProfile(req, res, next) {
    co(function* () {
        console.log(req.body)
        res.json(yield POSService.getCustomerProfile(req.auth, req.body));
    }).catch(next);
}

/**
 * POST /customers/balance
 * Gets the available points of a customer. non-anonymous
 *
 * @param req the request
 * @param res the response
 */
function getCustomerBalance(req, res, next) {
    co(function* () {
        res.json(yield POSService.getCustomerBalance(req.auth, req.body));
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
function earnPoints(req, res, next) {
    co(function* () {
        res.json(yield POSService.earnPoints(req.auth, req.swagger.params, req.body));
    }).catch(next);
}

/**
 * POST /customers/return
 * Updates the transaction amount of the customer. non-anonymous
 *
 * @param req the request
 * @param res the response
 * @param next the next step in the middleware flow
 */
function returnTransaction(req, res, next) {
    co(function* () {
        res.json(yield POSService.returnTransaction(req.auth, req.swagger.params, req.body));
    }).catch(next);
}

/**
 * POST /customers/void
 * Void the transaction of the customer. non-anonymous
 *
 * @param req the request
 * @param res the response
 * @param next the next step in the middleware flow
 */
function voidTransaction(req, res, next) {
    co(function* () {
        res.json(yield POSService.voidTransaction(req.auth, req.swagger.params, req.body));
    }).catch(next);
}

/**
 * POST /customers/reconciliation
 * Add transactions that is not listed within the day. non-anonymous
 *
 * @param req the request
 * @param res the response
 * @param next the next step in the middleware flow
 */
function reconciliation(req, res, next) {
    co(function* () {
        res.json(yield POSService.reconciliation(req.auth, req.swagger.params, req.body));
    }).catch(next);
}

/**
* POST /customers/redeem
* Redeems the points of the customer. non-anonymous
*
* @param req the request
* @param res the response
*/
function redeemPoints(req, res, next) {
    co(function* () {
        res.json(yield POSService.redeemPoints(req.auth, req.swagger.params, req.body));
    }).catch(next);
}

/**
 * POST /customers/new
 * Gets the list of all customers registered yesterday. non-anonymous
 *
 * @param req the request
 * @param res the response
 * @param next the next step in the middleware flow
 */
function getNewCustomers(req, res, next) {
    co(function* () {
        res.json(yield POSService.getNewCustomers(req.auth, req.swagger.params, req.body));
    }).catch(next);
}