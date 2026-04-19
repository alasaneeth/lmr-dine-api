'use strict';
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS || null,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 3306,
    dialect:  'mysql',
    seederStorage:   'sequelize',
    migrationStorage: 'sequelize',
  },
  test: {
    username: 'root',
    password: 'test',
    database: 'rms_test',
    host:     '127.0.0.1',
    dialect:  'mysql',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    dialect:  'mysql',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  },
};