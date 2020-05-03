'use strict';

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('branches', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			field: 'branch_id'
		},
		storeId: {
			type: DataTypes.BIGINT,
			allowNull: true,
			field: 'store_id'
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			field: 'name'
		},
		address: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'address'
		},
		city: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'city'
        },
        latitude: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'latitude'
        },
        longitude: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'longitude'
        },
        imageURL: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'image_url'
        },
        place: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'place'
        },
        contactNumber: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'contact_number'
        },
        openingTime: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'opening_time'
        },
        closingTime: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'closing_time'
        },
        createdAt: {
			type: 'TIMESTAMP',
			allowNull: false,
			field: 'updated_at'
		},
		updatedAt: {
			type: 'TIMESTAMP',
			allowNull: false,
			field: 'updated_at'
		},
	}, {
		tableName: 'branches',
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