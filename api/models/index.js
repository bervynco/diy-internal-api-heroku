'use strict';

const config = require('config');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(config.db.url.uat, {
    omitNull: false,
    underscored: true,
    logging: config.db.logging
  });

  const UserFn = require('./users');
  const UserRoleFn = require('./user_roles');
  const ActivityFn = require('./activities');
  const CustomerFn = require('./customers');
  const CustomerTransactionFn = require('./customer_transactions');
  const POSUsersFn = require('./pos_users');
  const CustomerRoleFn = require('./customer_roles');
  const BranchesFn = require('./branches');
  const TransactionItemsFn = require('./transaction_items');

  const User = UserFn(sequelize, Sequelize.DataTypes);
  const UserRole = UserRoleFn(sequelize, Sequelize.DataTypes);
  const Activity = ActivityFn(sequelize, Sequelize.DataTypes);
  const Customer = CustomerFn(sequelize, Sequelize.DataTypes);
  const CustomerTransaction = CustomerTransactionFn(sequelize, Sequelize.DataTypes);
  const POSUser = POSUsersFn(sequelize, Sequelize.DataTypes);
  const CustomerRole = CustomerRoleFn(sequelize, Sequelize.DataTypes);
  const Branches = BranchesFn(sequelize, Sequelize.DataTypes);
  const TransactionItems = TransactionItemsFn(sequelize, Sequelize.DataTypes);

  module.exports = {
      sequelize,
      Sequelize,
      User,
      UserRole,
      Activity,
      Customer,
      CustomerTransaction,
      POSUser,
      CustomerRole,
      Branches,
      TransactionItems
  };