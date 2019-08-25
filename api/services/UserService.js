"use strict";

const co = require("co");
const _ = require("lodash");
const moment = require('moment');
const util = require("util");
const errors = require("../helpers/errors");
const models = require("../models");
const db = require("../helpers/db");
const jwt = require("../helpers/jwt");
const utils = require("../helpers/utils");
const config = require('config');

const sequelize = models.sequelize;
const Sequelize = models.Sequelize;
const Op = Sequelize.Op;

const User = models.User;
const UserRole = models.UserRole;
const Activity = models.Activity;
// const Password = models.Password;

module.exports = {
    login,
    register,
    // refreshToken,
    // verify,
    // forgotPassword
};

/**
 * POST /users/login
 * user login, anonymous
 *
 * @param auth the authorized user
 * @param params the parameters for the method
 */
function* login(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    const email = entity.email;
    const password = entity.password;

    const user = yield User.findOne({
        where: { email: email }
    });
    if (!user) throw new errors.Auth("Invalid username or password");
    if (user.status != "active")
        throw new errors.Forbidden(
            "Username deactivated by one administrator. Please contact them to fix this."
        );
    // const match = yield utils.compare(password, user.password.toString("utf8"));
    // if (!match) throw new errors.Auth("Invalid username or password");

    let role = yield db.retrieveUserRole(user.id);
    role = role || { role: "su" };

    const payload = {
        userId: user.id,
        role: role.role
    };
    console.log(payload)

    var accessToken = jwt.create(payload, config.jwt.SECRET, {
        expiresIn: config.jwt.EXPIRATION_TIME
    });
    var refreshToken = jwt.create(payload, config.jwt.SECRET, {
        expiresIn: config.jwt.EXPIRATION_TIME * 100
    });

    yield Activity.create({
        userId: user.id,
        type: "login",
        createdBy: "system",
        updatedBy: "system"
    });

    return {
        accessToken: accessToken,
        refreshToken: refreshToken
    };
}

/**
* POST /users/register
* create a user in the application and send confirmation email to the email address specified. The implementations should verify that username, email is unique and the client payload is valid, anonymous
*
* @param auth the authorized user
* @param params the parameters for the method
*/
function* register(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    return sequelize
        .transaction(
            {
                isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
            },
            co.wrap(function* (t) {
                const email = entity.email;
                const existing = yield User.count({
                    where: { email: email }
                });
                if (existing != 0) throw new errors.BadRequest("User with email address already exists");
                const payload = { username: email };
                entity.status = 'active';
                //.activationToken = yield utils.randomString();
                entity.password = yield utils.hashString(entity.password, 4);
                yield User.create(entity, { transaction: t });
                console.log("ASDASDASD")
                // yield Password.create({customerId: created.id, password: entity.password}, { transaction: t });
                // const body = util.format(config.email.bodies.REGISTRATION, email, activationToken);
                // yield utils.email(config.email.FROM, email, config.email.subjects.REGISTRATION, body);
            })
        )
        .catch(function (err) {
            throw err;
        });
}