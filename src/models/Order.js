'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Order', {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    orderNumber: {
      type:      DataTypes.STRING(20),
      allowNull: false,
      unique:    true,
    },
    userId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    customerId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    tableNumber: {
      type:         DataTypes.STRING(20),
      allowNull:    true,
      defaultValue: 'Takeaway',
    },
    status: {
      type:         DataTypes.ENUM('pending','preparing','ready','served','paid','cancelled'),
      defaultValue: 'pending',
      allowNull:    false,
    },
    subtotal: {
      type:         DataTypes.DECIMAL(10, 2),
      allowNull:    false,
      defaultValue: 0,
    },
    total: {
      type:         DataTypes.DECIMAL(10, 2),
      allowNull:    false,
      defaultValue: 0,
    },
    notes: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName:  'orders',
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['user_id'] },
      { fields: ['customer_id'] },
      { fields: ['order_number'] },
      { fields: ['created_at'] },
    ],
  });
