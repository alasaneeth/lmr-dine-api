'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Customer', {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    name: {
      type:      DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type:      DataTypes.STRING(191),
      allowNull: true,
      unique:    true,
      validate:  { isEmail: true },
    },
    phone: {
      type:      DataTypes.STRING(30),
      allowNull: true,
    },
    address: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type:         DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    creditLimit: {
      type:         DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    outstandingBalance: {
      type:         DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    totalPurchases: {
      type:         DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    notes: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName:  'customers',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['status'] },
    ],
  });
