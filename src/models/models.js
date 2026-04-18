'use strict';
const { DataTypes } = require('sequelize');

// ── OrderItem ─────────────────────────────────────────────────────────────────
const OrderItemModel = (sequelize) =>
  sequelize.define('OrderItem', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    order_id:     { type: DataTypes.UUID, allowNull: false },
    menu_item_id: { type: DataTypes.UUID, allowNull: false },
    name:         { type: DataTypes.STRING(120), allowNull: false }, // snapshot
    price:        { type: DataTypes.DECIMAL(10, 2), allowNull: false }, // snapshot
    qty:          { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    subtotal:     { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  }, {
    tableName: 'order_items',
    indexes: [{ fields: ['order_id'] }, { fields: ['menu_item_id'] }],
  });

// ── Invoice ───────────────────────────────────────────────────────────────────
const InvoiceModel = (sequelize) =>
  sequelize.define('Invoice', {
    id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    invoice_no: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    order_id:   { type: DataTypes.UUID, allowNull: false },
    cashier_id: { type: DataTypes.UUID, allowNull: true },
    subtotal:   { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    tax:        { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    discount:   { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total:      { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'void'),
      defaultValue: 'pending',
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'card', 'online'),
      allowNull: true,
    },
    paid_at:    { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'invoices',
    indexes: [
      { fields: ['order_id'] },
      { fields: ['status'] },
      { fields: ['paid_at'] },
      { unique: true, fields: ['invoice_no'] },
    ],
  });

// ── StockItem ─────────────────────────────────────────────────────────────────
const StockItemModel = (sequelize) =>
  sequelize.define('StockItem', {
    id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:    { type: DataTypes.STRING(100), allowNull: false, unique: true },
    unit:    { type: DataTypes.STRING(20), allowNull: false },
    qty:     { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    min_qty: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    price:   { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  }, {
    tableName: 'stock_items',
    indexes: [{ fields: ['name'] }],
  });

// ── RefreshToken ──────────────────────────────────────────────────────────────
const RefreshTokenModel = (sequelize) =>
  sequelize.define('RefreshToken', {
    id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id:    { type: DataTypes.UUID, allowNull: false },
    token_hash: { type: DataTypes.STRING(255), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    is_revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
    replaced_by:{ type: DataTypes.STRING(255), allowNull: true },
    user_agent: { type: DataTypes.STRING(500), allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
  }, {
    tableName: 'refresh_tokens',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['token_hash'] },
      { fields: ['expires_at'] },
    ],
  });

// ── Notification ──────────────────────────────────────────────────────────────
const NotificationModel = (sequelize) =>
  sequelize.define('Notification', {
    id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: true }, // null = broadcast
    type:    { type: DataTypes.STRING(50), allowNull: false },
    title:   { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    data:    { type: DataTypes.JSON, allowNull: true },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'notifications',
    indexes: [{ fields: ['user_id'] }, { fields: ['is_read'] }],
  });

module.exports = { OrderItemModel, InvoiceModel, StockItemModel, RefreshTokenModel, NotificationModel };
