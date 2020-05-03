'use strict';

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('customerRoles', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			field: 'cr_id'
		},
		customerId: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'customers',
				key: 'customer_id'
			},
			field: 'customer_id'
		},
		role: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'role'
		},
		roleName: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'role_name'
		},
		updatedBy: {
			type: DataTypes.STRING,
			allowNull: false,
			field: 'updated_by'
		},
		updatedAt: {
			type: 'TIMESTAMP',
			allowNull: false,
			field: 'updated_at'
		},
	}, {
		tableName: 'customer_roles',
		freezeTableName: true,
		timestamps: false,
		underscored: true,
		hooks: {
			beforeCreate: function(instance, options) {
				const milliseconds = require('moment')().format('YYYY-MM-DD HH:mm:ss').toString();
				instance.updatedAt = milliseconds;
			},
			beforeUpdate: function(instance, options) {
				const milliseconds = require('moment')().format('YYYY-MM-DD HH:mm:ss').toString();
				instance.updatedAt = milliseconds;
			},
			beforeValidate: function(instance, options) {
				const milliseconds = require('moment')().format('YYYY-MM-DD HH:mm:ss').toString();
				if (!instance.updatedAt) instance.updatedAt = milliseconds;
			}
		}
	});
};