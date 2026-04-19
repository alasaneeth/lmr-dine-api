'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('StockItem', {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    name: {
      type:      DataTypes.STRING(150),
      allowNull: false,
    },
    unit: {
      type:         DataTypes.STRING(20),
      defaultValue: 'units',
    },
    qty: {
      type:         DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },
    minQty: {
      type:         DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },
    price: {
      type:         DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    isActive: {
      type:         DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName:  'stock_items',
    timestamps: true,
    indexes: [
      { fields: ['is_active'] },
    ],
  });
