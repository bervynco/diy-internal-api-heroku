'use strict';

const co = require('co');
const UserService = require('../services/UserService');

module.exports = {
    login,
    register,
    refreshToken,
    // forgotPassword
};
/**
 * POST /users/login
 * user login, anonymous
 *
 * @param req the request
 * @param res the response
 * @param next the next step in the middleware flow
 */
function login(req, res, next) {
    co(function* () {
        res.json(yield UserService.login(req.auth, req.swagger.params, req.body));
    }).catch(next);
}
/**
 * POST /users/register
 * create a user in the application and send confirmation email to the email address specified. The implementations should verify that email is unique and the client payload is valid, anonymous
 *
 * @param req the request
 * @param res the response
 * @param next the next step in the middleware flow
 */
function register(req, res, next) {
    co(function* () {
        res.json(yield UserService.register(req.auth, req.swagger.params, req.body));
    }).catch(next);
}

/**
 * POST /users/refreshtoken
 * Validate the access token and issue a new access token, non-anonymous
 *
 * @param req the request
 * @param res the response
 * @param next the next step in the middleware flow
 */
function refreshToken(req, res, next) {
    co(function* (){
      res.json(yield UserService.refreshToken(req.auth, req.swagger.params, req.body));
    }).catch(next);
  }