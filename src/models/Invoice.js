'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Invoice', {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    invoiceNumber: {
      type:      DataTypes.STRING(20),
      allowNull: false,
      unique:    true,
    },
    orderId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    customerId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    subtotal: {
      type:      DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    taxAmount: {
      type:         DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    discountAmount: {
      type:         DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total: {
      type:      DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type:         DataTypes.ENUM('pending', 'paid', 'voided'),
      defaultValue: 'pending',
    },
    paidAt: {
      type:      DataTypes.DATE,
      allowNull: true,
    },
    paymentMethod: {
      type:         DataTypes.ENUM('cash', 'card', 'transfer', 'credit'),
      defaultValue: 'cash',
    },
    notes: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName:  'invoices',
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['order_id'] },
      { fields: ['customer_id'] },
      { fields: ['created_at'] },
      { fields: ['invoice_number'] },
    ],
  });
