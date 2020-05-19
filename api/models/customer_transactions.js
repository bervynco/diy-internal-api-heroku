'use strict';

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('customer_transactions', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			field: 'ct_id'
		},
		customerKey: {
			type: DataTypes.BIGINT,
			allowNull: false,
			field: 'customer_key'
		},
		branchId: {
			type: DataTypes.BIGINT,
			allowNull: false,
			field: 'branch_id'
		},
		wallet: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'wallet'
        },
        transactionAmount: {
			type: 'NUMERIC',
			allowNull: false,
			defaultValue: 0,
			field: 'transaction_amount'
		},
		points: {
			type: 'NUMERIC',
			allowNull: false,
			defaultValue: 0,
			field: 'points'
		},
		transactionType: {
			type: DataTypes.ENUM('credit','debit'),
			allowNull: false,
			field: 'transaction_type'
		},
		description: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'description'
		},
		referenceNumber: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'reference_number'
		},
		status: {
			type: DataTypes.ENUM('approved','declined','pending'),
			allowNull: true,
			field: 'status'
		},
		expirationDate: {
			type: 'TIMESTAMP',
			allowNull: true,
			field: 'expiration_date'
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
		tableName: 'customer_transactions',
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
