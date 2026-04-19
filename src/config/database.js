'use strict';
const { Sequelize } = require('sequelize');
const cfg           = require('./env');
const logger        = require('../utils/logger');

const sequelize = new Sequelize(cfg.db.name, cfg.db.user, cfg.db.pass, {
  host:    cfg.db.host,
  port:    cfg.db.port,
  dialect: 'mysql',
  pool:    cfg.db.pool,
  logging: (msg) => logger.debug(msg),
  define: {
    underscored:   true,
    timestamps:    true,
    freezeTableName: false,
  },
  dialectOptions: {
    charset: 'utf8mb4',
    decimalNumbers: true,
  },
});

/**
 * Test the DB connection.
 */
async function connectDB() {
  try {
    await sequelize.authenticate();
    logger.info('✅  MySQL connected successfully.');
  } catch (err) {
    logger.error('❌  MySQL connection error:', err);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
