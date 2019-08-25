'use strict';

const co = require('co');
const AdminUserService = require('../services/AdminUserService');

module.exports = {
    getAllUsers,
    // getUserDetail,
    // deleteUser,
    // updateUserDetail,
    // getUserActivities,
    addUser,
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