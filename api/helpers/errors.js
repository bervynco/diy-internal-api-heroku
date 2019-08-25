/**
* Copyright (c) All rights reserved.
*/

"use strict";

/**
* A module to list all the api error codes with proper description
*
* @author      AUTOMATIONCOE
* @version     1.0
*/

const _ = require('lodash');
// const stringify = require('json-stringify-safe');
const util = require('util');

const errors = {
  RESOURCE_NOT_FOUND: {
    code: '1000',
    description: 'Indicates that a resoure is not found on the system.',
  },
  UNKNOWN: {
    code: '1100',
    description: 'Indicates that the error is unexpected and cause is not known.',
  },
  INVALID_REQUEST: {
    code: '1010',
    description: 'Indicates that the error is caused by invalid client parameter or data.',
  },
  API_NOT_SUPPORTED: {
    code: '1020',
    description: 'Error is thrown when some of the api is not yet implemented.',
  },
  AUTH_HEADER_REQUIRED: {
    code: '1030',
    description: 'Error is thrown when authorization header is missig from the request headers.',
  },
  AUTH_TOKEN_INVALID: {
    code: '1040',
    description: 'Error is thrown when access token is invalid.',
  },
  AUTH_TOKEN_EXPIRED: {
    code: '1050',
    description: 'Error is thrown when access token is expired.',
  },
  NOT_PERMITTED: {
    code: '1050',
    description: 'Error is thrown when operation is not permitted by the auth user.',
  },
};
const processed = [];

_.keys(errors).forEach((value) => {
  const single = { };
  single[value] = errors[value].code;
  processed.push(single);
});

/**
 * Common error with message and custom code
 * @param {String} message - error message
 * @param {Number} code    - response status code, defaults to 400
 */
function CommonError(message, statusCode, code) {
  Error.call(this);
  // Error.captureStackTrace(this, this.constructor);

  this.name = this.constructor.name;
  this.message = message;
  this.statusCode = statusCode || 400;
  this.code = code || errors.UNKNOWN.code;

  return this;
}
util.inherits(CommonError, Error);

/**
 * Authentication Error
 * @param {String} message - defaults to 'Not authorized'
 */
function AuthError(message, code) {
    console.log("AUTH")
    CommonError.call(this, message || 'Not authorized', 401, code || errors.AUTH_HEADER_REQUIRED.code);
    return this;
  }
  util.inherits(AuthError, CommonError);

/**
 * Resource Not Found Error
 * @param {String} message - defaults to `Not Found`
 */
function NotFoundError(message) {
  CommonError.call(this, message || 'Not Found', 404, errors.RESOURCE_NOT_FOUND.code);
  return this;
}
util.inherits(NotFoundError, CommonError);

/**
 * Access Forbidden Error
 * @param {String} message - defaults to `Forbidden`
 */
function ForbiddenError(message) {
    CommonError.call(this, message || 'Forbidden', 403, errors.NOT_PERMITTED.code);
    return this;
  }
  util.inherits(ForbiddenError, CommonError);

/**
 * Bad Request Error
 * @param {String|Object} payload - details of the error
 */
function BadRequestError(payload) {
    CommonError.call(this, 'Bad Request', 400, errors.INVALID_REQUEST.code);
    this.data = payload;
    return this;
  }
  util.inherits(BadRequestError, CommonError);

/**
 * Public API
 * @type {Object}
 */
module.exports = {
  Common: CommonError,
  NotFound: NotFoundError,
  Auth: AuthError,
  Forbidden: ForbiddenError,
  BadRequest: BadRequestError,
};
