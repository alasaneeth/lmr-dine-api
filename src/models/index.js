'use strict';
const { Sequelize } = require('sequelize');
const config = require('../config/database');
const { logger } = require('../utils/logger');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host:           dbConfig.host,
    port:           dbConfig.port,
    dialect:        dbConfig.dialect,
    pool:           dbConfig.pool,
    logging:        dbConfig.logging,
    define:         dbConfig.define,
    dialectOptions: dbConfig.dialectOptions || {},
  }
);

// ── Import models ────────────────────────────────────────────────────────────
const User          = require('./User')(sequelize);
const MenuItem      = require('./MenuItem')(sequelize);
const Category      = require('./Category')(sequelize);
const Order         = require('./Order')(sequelize);
const OrderItem     = require('./OrderItem')(sequelize);
const Invoice       = require('./Invoice')(sequelize);
const StockItem     = require('./StockItem')(sequelize);
const RefreshToken  = require('./RefreshToken')(sequelize);
const Notification  = require('./Notification')(sequelize);

// ── Associations ─────────────────────────────────────────────────────────────

// Category ↔ MenuItem
Category.hasMany(MenuItem, { foreignKey: 'category_id', as: 'menuItems' });
MenuItem.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// User ↔ Order
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Order ↔ OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// MenuItem ↔ OrderItem
MenuItem.hasMany(OrderItem, { foreignKey: 'menu_item_id', as: 'orderItems' });
OrderItem.belongsTo(MenuItem, { foreignKey: 'menu_item_id', as: 'menuItem' });

// Order ↔ Invoice (1-to-1)
Order.hasOne(Invoice, { foreignKey: 'order_id', as: 'invoice' });
Invoice.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// User ↔ Invoice (cashier who processed)
User.hasMany(Invoice, { foreignKey: 'cashier_id', as: 'processedInvoices' });
Invoice.belongsTo(User, { foreignKey: 'cashier_id', as: 'cashier' });

// User ↔ RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── Test connection & sync in test env ───────────────────────────────────────
const connectDB = async () => {
  await sequelize.authenticate();
  logger.info('✓ MySQL connection established');

  if (env === 'development') {
    await sequelize.sync({ alter: true }); // ← creates missing tables, adds missing columns
    logger.info('✓ All tables synced successfully');
  }
};

module.exports = {
  sequelize,
  Sequelize,
  connectDB,
  User,
  MenuItem,
  Category,
  Order,
  OrderItem,
  Invoice,
  StockItem,
  RefreshToken,
  Notification,
};
