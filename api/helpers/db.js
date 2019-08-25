'use strict';

const utils = require('./utils');
const errors = require('./errors');
const models = require('../models');
const humps = require('humps');
const _ = require('lodash');

const sequelize = models.sequelize;
const UserRole = models.UserRole;

module.exports = {
  retrieveUserRole,
  retrieveUsers
}

function* retrieveUserRole(userId) {
  const userRole = yield UserRole.findOne({
    where: {
      user_id: userId
    }
  });
  return userRole;
}

function* retrieveUsers() {
  const sql = "SELECT u.user_id as id, u.first_name, u.last_name,u.email, u.status, u.created_at, role, (SELECT first_name FROM users WHERE u.created_by = users.user_id) as creator, a.created_at as last_login FROM users as u inner join user_roles as ur on u.user_id = ur.user_id left join activities as a on u.user_id = a.user_id AND a.activity_id = (select activity_id from activities ac where ac.type = 'login' and ac.user_id = u.user_id order by updated_at desc limit 1);";
  let results = yield sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  // results = _.omit(results, ['password', 'updated_by', 'updated_at']);
  // console.log(results);
  return humps.camelizeKeys(results);
}