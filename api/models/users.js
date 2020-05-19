'use strict';

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('users', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			field: 'user_id'
		},
		firstName: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'first_name'
		},
		lastName: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'last_name'
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			field: 'email'
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			field: 'password'
		},
		status: {
			type: DataTypes.ENUM('active','inactive'),
			allowNull: true,
			field: 'status'
		},
		branchId: {
			type: DataTypes.BIGINT,
			allowNull: true,
			references: {
				model: 'branches',
				key: 'branch_id'
			},
			field: 'branch_id'
		},
		createdBy: {
			type: DataTypes.STRING,
			allowNull: false,
			field: 'created_by'
		},
		updatedBy: {
			type: DataTypes.STRING,
			allowNull: false,
			field: 'updated_by'
        },
		createdAt: {
			type: 'TIMESTAMP',
			allowNull: false,
			field: 'created_at'
		},
		updatedAt: {
			type: 'TIMESTAMP',
			allowNull: false,
			field: 'updated_at'
		}
	}, {
		tableName: 'users',
		freezeTableName: true,
		timestamps: false,
		omitNull: false,
		underscored: true,
		hooks: {
			beforeCreate: function(instance, options) {
				const milliseconds = require('moment')().format('YYYY-MM-DD HH:mm:ss').toString();
				console.log(milliseconds);
				instance.createdAt = milliseconds;
				instance.updatedAt = milliseconds;
			},
			beforeUpdate: function(instance, options) {
				console.log("UDPATE", instance.updatedAt)
				const milliseconds = require('moment')().format('YYYY-MM-DD HH:mm:ss').toString();
				instance.updatedAt = milliseconds;
			},
			beforeValidate: function(instance, options) {
				const milliseconds = require('moment')().format('YYYY-MM-DD HH:mm:ss').toString();
				if (!instance.createdAt) instance.createdAt = milliseconds;
				if (!instance.updatedAt) instance.updatedAt = milliseconds;
			}
		}
	});
};
