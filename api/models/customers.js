'use strict';

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('customers', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			field: 'customer_id'
		},
		customerKey: {
			type: DataTypes.BIGINT,
			allowNull: true,
			field: 'customer_key'
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
		gender: {
			type: DataTypes.ENUM('male','female'),
			allowNull: true,
			field: 'gender'
		},
		city: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'city'
		},
		birthday: {
			type: DataTypes.DATEONLY,
			allowNull: true,
			field: 'birthday'
		},
		contactNumber: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'contact_number'
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			field: 'is_active'
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			field: 'password'
		},
		resetPasswordToken: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'resetPasswordToken'
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
		tableName: 'customers',
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
