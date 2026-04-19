'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('OrderItem', {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    orderId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    menuItemId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    name: {
      type:      DataTypes.STRING(150),
      allowNull: false,
    },
    price: {
      type:      DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    qty: {
      type:         DataTypes.INTEGER.UNSIGNED,
      allowNull:    false,
      defaultValue: 1,
    },
    lineTotal: {
      type:      DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  }, {
    tableName:  'order_items',
    timestamps: false,
    indexes: [
      { fields: ['order_id'] },
      { fields: ['menu_item_id'] },
    ],
  });
