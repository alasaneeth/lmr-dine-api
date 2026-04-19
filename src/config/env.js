'use strict';
require('dotenv').config();

// DB_PASS is excluded — WAMP/XAMPP local servers often have no root password
const required = [
  'DB_HOST', 'DB_NAME', 'DB_USER',
  'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET',
];

for (const key of required) {
  if (process.env[key] === undefined || process.env[key] === null) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  env:  process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  db: {
    host:    process.env.DB_HOST,
    port:    parseInt(process.env.DB_PORT, 10) || 3306,
    name:    process.env.DB_NAME,
    user:    process.env.DB_USER,
    pass:    process.env.DB_PASS || null,   // null = no password (WAMP default)
    pool: {
      max:     parseInt(process.env.DB_POOL_MAX, 10)     || 10,
      min:     parseInt(process.env.DB_POOL_MIN, 10)     || 2,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle:    parseInt(process.env.DB_POOL_IDLE, 10)    || 10000,
    },
  },

  jwt: {
    accessSecret:   process.env.JWT_ACCESS_SECRET,
    refreshSecret:  process.env.JWT_REFRESH_SECRET,
    accessExpires:  process.env.JWT_ACCESS_EXPIRES  || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max:      parseInt(process.env.RATE_LIMIT_MAX, 10)       || 100,
  },

  upload: {
    dir:         process.env.UPLOAD_DIR  || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    pass: process.env.REDIS_PASS || undefined,
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir:   process.env.LOG_DIR   || 'logs',
  },

  sentry: {
    dsn: process.env.SENTRY_DSN || null,
  },
};
