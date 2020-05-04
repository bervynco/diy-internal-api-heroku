'use strict';

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('transactionItems', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			field: 'tl_id'
		},
		referenceNumber: {
			type: DataTypes.BIGINT,
			allowNull: false,
			field: 'reference_number'
		},
		itemCode: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'item_code'
		},
		itemDescription: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'item_description'
		},
		itemQuantity: {
			type: DataTypes.STRING,
			allowNull: false,
			field: 'item_quantity'
		},
		createdAt: {
			type: 'TIMESTAMP',
			allowNull: false,
			field: 'created_at'
		},
	}, {
		tableName: 'transaction_items',
		freezeTableName: true,
		timestamps: false,
		underscored: true,
		hooks: {
			beforeCreate: function(instance, options) {
				const milliseconds = require('moment')().format('YYYY-MM-DD HH:mm:ss').toString();
				instance.createdAt = milliseconds;
			},
			// beforeUpdate: function(instance, options) {
			// 	const milliseconds = require('moment')().format('YYYY-MM-DD HH:mm:ss').toString();
			// 	instance.updatedAt = milliseconds;
			// },
			beforeValidate: function(instance, options) {
				const milliseconds = require('moment')().format('YYYY-MM-DD HH:mm:ss').toString();
				if (!instance.createdAt) instance.createdAt = milliseconds;
			}
		}
	});
};