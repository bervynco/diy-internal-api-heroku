'use strict';

const errors = require('../helpers/errors');
const utils = require('../helpers/utils');
const db = require('../helpers/db');
const models = require('../models');
const config = require('config');
const _ = require('lodash');

const co = require('co');

const sequelize = models.sequelize;
const Sequelize = models.Sequelize;

const User = models.User;
const UserRole = models.UserRole;

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