'use strict';
const { sequelize } = require('../config/database');

// ── Import models ─────────────────────────────────────────────────────────────
const User         = require('./User')(sequelize);
const RefreshToken = require('./RefreshToken')(sequelize);
const MenuItem     = require('./MenuItem')(sequelize);
const Order        = require('./Order')(sequelize);
const OrderItem    = require('./OrderItem')(sequelize);
const Invoice      = require('./Invoice')(sequelize);
const StockItem    = require('./StockItem')(sequelize);
const Customer     = require('./Customer')(sequelize);
const AuditLog     = require('./AuditLog')(sequelize);

// ── Associations ──────────────────────────────────────────────────────────────

// User ↔ RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

// User → Order (placed by)
User.hasMany(Order, { foreignKey: 'userId', onDelete: 'SET NULL' });
Order.belongsTo(User, { as: 'placedBy', foreignKey: 'userId' });

// Customer → Order (optional link)
Customer.hasMany(Order, { foreignKey: 'customerId', onDelete: 'SET NULL' });
Order.belongsTo(Customer, { as: 'customer', foreignKey: 'customerId' });

// Order ↔ OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// MenuItem ↔ OrderItem
MenuItem.hasMany(OrderItem, { foreignKey: 'menuItemId', onDelete: 'RESTRICT' });
OrderItem.belongsTo(MenuItem, { as: 'menuItem', foreignKey: 'menuItemId' });

// Order → Invoice (1:1)
Order.hasOne(Invoice, { foreignKey: 'orderId', onDelete: 'RESTRICT' });
Invoice.belongsTo(Order, { foreignKey: 'orderId' });

// Customer → Invoice
Customer.hasMany(Invoice, { foreignKey: 'customerId', onDelete: 'SET NULL' });
Invoice.belongsTo(Customer, { as: 'customer', foreignKey: 'customerId' });

// User → AuditLog
User.hasMany(AuditLog, { foreignKey: 'userId', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  RefreshToken,
  MenuItem,
  Order,
  OrderItem,
  Invoice,
  StockItem,
  Customer,
  AuditLog,
};
