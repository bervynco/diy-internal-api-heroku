'use strict';

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('activities', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			field: 'activity_id'
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false,
			field: 'type'
		},
		// meta: {
		// 	type: DataTypes.JSON,
		// 	allowNull: false,
		// 	field: 'meta'
		// },
		userId: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'user_id'
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
		tableName: 'activities',
		freezeTableName: true,
		timestamps: false,
		underscored: true,
		hooks: {
			beforeCreate: function(instance, options) {
				const milliseconds = require('moment')().format('YYYY-MM-DD HH:mm:ss').toString();
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
