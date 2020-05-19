'use strict';

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('pos_users', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			field: 'pu_id'
		},
		branchId: {
			type: DataTypes.BIGINT,
			allowNull: false,
			field: 'branch_id'
		},
		username: {
			type: DataTypes.STRING,
			allowNull: false,
			field: 'username'
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			field: 'password'
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
		},
		lastSyncedAt:{
			type: 'TIMESTAMP',
			allowNull: false,
			field: 'last_synced_at'
		}
	}, {
		tableName: 'pos_users',
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
