'use strict';

const jwt = require('jsonwebtoken');
const moment = require('moment');
const _ = require('lodash');
const config = require('config');
const errors = require("../helpers/errors");

const authorize = function (req, authOrSecDef, scopesOrApiKey, cb) {
  const authorizationHeader = scopesOrApiKey || `Bearer ${req.query.token}`;
  if (!authorizationHeader) return cb(new errors.Auth('No Authorization header specified'));
  const splitted = authorizationHeader.split(' ');
  if (splitted.length !== 2 || splitted[0] !== 'Bearer') {
    return cb(new errors.Auth('Invalid Authorization header specified'));
  }
  const claims = jwt.decode(splitted[1], config.JWT_SECRET);
  if (!claims) return cb(new errors.Auth('Invalid Authorization header specified'));
  // check token expiry
  const unix = moment().unix();
  if (unix >= claims.exp) return cb(new errors.Auth('Access token is expired'));
  console.log("CLAIMS", claims);

  let roleAccess = true;
  let permissionAccess = true;

  var accessControl = req.swagger.operation['x-access-control'] || {};
  accessControl.permissions = accessControl.permissions || [];

  if (accessControl.role)
    if (_.isString(accessControl.role)) {
      if (accessControl.role !== claims.role)
        roleAccess = false;
    } else {
      if (!_.includes(accessControl.role, claims.role))
        roleAccess = false;
    }

  accessControl.permissions.forEach((permission) => {
    if (!claims.permissions || claims.permissions.length === 0 || claims.permissions.indexOf(permission) === -1) {
      permissionAccess = false;
    }
  });

  if (roleAccess === false || permissionAccess === false) {
    return cb(new errors.Forbidden('Operation not permitted'));
  }
  req.auth = {
    token: splitted[1],
    userId: claims.userId,
    role: claims.role
  };
  cb();
};

const create = function (payload, secretOrPrivateKey, options) {
  secretOrPrivateKey = secretOrPrivateKey || config.jwt.SECRET;
  options = options || {};
  options.expiresIn = options.expiresIn || config.jwt.EXPIRATION_TIME;
  return jwt.sign(payload, secretOrPrivateKey, options);
};

const refresh = function (token, secretOrPrivateKey, options) {
  var limitDate, payload;
  limitDate = void 0;
  payload = void 0;
  secretOrPrivateKey = secretOrPrivateKey || config.jwt.SECRET;
  options = options || {};
  try {
    payload = jwt.decode(token, secretOrPrivateKey);
  } catch (error) {
    return new jwt.JsonWebTokenError('invalid token');
  }
  if (typeof payload.exp !== 'undefined') {
    limitDate = new Date(payload.exp * 1000);
    if (Math.floor(Date.now() / 1000) >= Math.floor(limitDate / 1000)) {
      return new jwt.TokenExpiredError('jwt expired', new Date(payload.exp * 1000));
    } else {
      return jwt.sign(_.omit(payload, 'exp', 'iat'), config.jwt.SECRET, options);
    }
  } else {
    return token;
  }
};

module.exports = {
  create: create,
  refresh: refresh,
  authorize: authorize,
  decode: jwt.decode
};