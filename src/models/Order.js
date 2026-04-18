'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Order', {
    id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    order_no:   { type: DataTypes.STRING(20), allowNull: false, unique: true },
    user_id:    { type: DataTypes.UUID, allowNull: true },
    table_no:   { type: DataTypes.STRING(20), allowNull: false },
    customer_name: { type: DataTypes.STRING(100), allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'),
      defaultValue: 'pending',
    },
    total:      { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    notes:      { type: DataTypes.TEXT, allowNull: true },
    placed_at:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'orders',
    indexes: [
      { fields: ['status'] },
      { fields: ['user_id'] },
      { fields: ['placed_at'] },
      { unique: true, fields: ['order_no'] },
    ],
  });
