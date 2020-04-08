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
  retrieveUsers,
  retrievePriceRangeGender,
  retrieveBranchNewMembers,
  retrieveGenderDemographics,
  retrieveCustomerAgeRange,
  retrieveLivedCity,
  retrieveMembersCount,
  retrieveMembersLastCount,
  rerieveCustomerPointSummary,
  rerieveNewCustomers
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
  const sql = "SELECT u.user_id as id, u.first_name, u.last_name,u.email, u.status, u.created_at, role, " +
    "(SELECT first_name FROM users WHERE u.created_by = users.user_id) as creator, a.created_at as last_login " +
    "FROM users as u inner join user_roles as ur on u.user_id = ur.user_id left join activities as a on u.user_id = a.user_id AND a.activity_id = (select activity_id from activities ac where ac.type = 'login' and ac.user_id = u.user_id order by updated_at desc limit 1);";
  let results = yield sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  // results = _.omit(results, ['password', 'updated_by', 'updated_at']);
  // console.log(results);
  return humps.camelizeKeys(results);
}

function* retrievePriceRangeGender(interval) {
  var sql = "SELECT SUM(CASE WHEN c.gender = 'female' then ct.transaction_amount else 0 end) as female, SUM(CASE WHEN c.gender = 'male' then ct.transaction_amount else 0 end) as male, DATE(ct.created_at) as datetime " +
    "FROM customer_transactions  as ct " +
    "INNER JOIN customers as c " +
    "ON c.customer_key = ct.customer_key " +
    "WHERE ct.transaction_type ='credit' ";
  if (interval == "date") sql += "AND MONTH(ct.created_at) = MONTH(CURRENT_DATE()) ";
  if (interval == "date" || interval == "month") sql += "AND YEAR(ct.created_at) = YEAR(CURRENT_DATE()) "
  sql += "GROUP BY " + interval + "(ct.created_at);";
  let results = yield sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  return results;
}

function* retrieveBranchNewMembers(interval) {
  var sql = "SELECT COUNT(1) as count, c.city, DATE(c.created_at) as datetime " +
    "FROM customers as c ";
  if (interval != "year") sql += "WHERE ";
  if (interval == "date") sql += "MONTH(c.created_at) = MONTH(CURRENT_DATE()) AND ";
  if (interval == "date" || interval == "month") sql += "YEAR(c.created_at) = YEAR(CURRENT_DATE()) "
  sql += "GROUP BY c.city, " + interval + "(c.created_at);";
  let results = yield sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  return results;
}

function* retrieveGenderDemographics(interval) {
  var sql = "SELECT SUM(CASE WHEN gender = 'female' then 1 else 0 end) as female, SUM(CASE WHEN gender = 'male' then 1 else 0 end) as male, DATE(created_at) as datetime " +
    "FROM customers ";
  if (interval != "year") sql += "WHERE ";
  if (interval == "date") sql += "MONTH(created_at) = MONTH(CURRENT_DATE()) AND ";
  if (interval == "date" || interval == "month") sql += "YEAR(created_at) = YEAR(CURRENT_DATE()) "
  sql += "GROUP BY " + interval + "(created_at);";
  let results = yield sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  return results;
}

function* retrieveCustomerAgeRange(interval) {
  var sql = "SELECT SUM(CASE WHEN c.age < 21 then 1 else 0 end) as '10-20', SUM(CASE WHEN 20 < c.age and c.age < 31 then 1 else 0 end) as '21-30', " +
    "SUM(CASE WHEN 30 < c.age and c.age < 41 then 1 else 0 end) as '31-40', SUM(CASE WHEN 40 < c.age and c.age < 66 then 1 else 0 end) as '41-65', " +
    "SUM(CASE WHEN 65 < c.age then 1 else 0 end) as '65 and above', DATE(c.created_at) as datetime " +
    "FROM (" +
    "SELECT YEAR(CURRENT_TIMESTAMP) - YEAR(birthday) - (RIGHT(CURRENT_DATE, 5) < RIGHT(birthday, 5)) as age, created_at " +
    "FROM customers " +
    ") AS c ";
  if (interval != "year") sql += "WHERE ";
  if (interval == "date") sql += "MONTH(c.created_at) = MONTH(CURRENT_DATE()) AND ";
  if (interval == "date" || interval == "month") sql += "YEAR(c.created_at) = YEAR(CURRENT_DATE()) "
  sql += "GROUP BY " + interval + "(created_at);";
  let results = yield sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  return results;
}

function* retrieveLivedCity(interval) {
  var sql = "SELECT COUNT(1) as count, city " +
    "FROM customers ";
  if (interval == "date") sql += "WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) ";
  if (interval == "month") sql += "WHERE YEAR(created_at) = YEAR(CURRENT_DATE()) ";
  sql += "GROUP BY city;";
  let results = yield sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  return results;
}

function* retrieveMembersCount(interval, startDate) {
  var sql = "SELECT COUNT(1) as count, DATE(created_at) as datetime " +
    "FROM customers ";
  if (interval == "date") sql += "WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) ";
  if (interval == "month") sql += `WHERE ${startDate} <= created_at  `;
  sql += `GROUP BY ${interval}(created_at) ORDER BY datetime;`;
  let results = yield sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  return results;
}

function* retrieveMembersLastCount(startDate) {
  var sql = `SELECT COUNT(1) as count FROM customers WHERE ${startDate} >= created_at;`;
  let results = yield sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  return results;
}

function* rerieveCustomerPointSummary(customerKey) {
  var sql = `SELECT COALESCE(SUM(case when transaction_type = 'credit' and status = 'approved' then points else 0 end),0) as total_earnings,
  COALESCE(SUM(case when transaction_type = 'debit' and status = 'approved' then points else 0 end),0) as total_redeems
  FROM customer_transactions
  WHERE customer_key='${customerKey}';`

  let results = yield sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  return humps.camelizeKeys(results[0]) || { total_earnings: 0, total_redeems: 0};
}

function* rerieveNewCustomers() {
  var sql = `SELECT customer_key as customerKey, first_name as firstName, last_name as lastName, email FROM customers
  WHERE DATE(created_at) = DATE_SUB(CURRENT_DATE(),INTERVAL 1 DAY);`

  let results = yield sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  return results;
}