'use strict';
require('dotenv').config();

/**
 * Sequelize database configuration.
 * Supports development, test, and production environments.
 * Uses connection pooling and secure SSL in production.
 */

const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  dialect:  'mysql',
  pool: {
    max:     parseInt(process.env.DB_POOL_MAX     || '10', 10),
    min:     parseInt(process.env.DB_POOL_MIN     || '2',  10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
    idle:    parseInt(process.env.DB_POOL_IDLE    || '10000', 10),
  },
  logging: process.env.NODE_ENV === 'development'
    ? (msg) => require('../utils/logger').logger.debug(msg)
    : false,
  define: {
    underscored: true,      // use snake_case column names
    timestamps:  true,      // created_at / updated_at on every model
    paranoid:    true,      // soft deletes via deleted_at
  },
};

module.exports = {
  development: { ...baseConfig },
  test: {
    ...baseConfig,
    database: `${process.env.DB_NAME}_test`,
    logging:  false,
  },
  production: {
    ...baseConfig,
    dialectOptions: {
      ssl: {
        require:            true,
        rejectUnauthorized: false,
      },
    },
  },
};
