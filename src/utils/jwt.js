'use strict';
const jwt = require('jsonwebtoken');
const cfg = require('../config/env');

const signAccess = (payload) =>
  jwt.sign(payload, cfg.jwt.accessSecret, {
    expiresIn: cfg.jwt.accessExpires,
    issuer:    'rms-api',
  });

const signRefresh = (payload) =>
  jwt.sign(payload, cfg.jwt.refreshSecret, {
    expiresIn: cfg.jwt.refreshExpires,
    issuer:    'rms-api',
  });

const verifyAccess = (token) =>
  jwt.verify(token, cfg.jwt.accessSecret, { issuer: 'rms-api' });

const verifyRefresh = (token) =>
  jwt.verify(token, cfg.jwt.refreshSecret, { issuer: 'rms-api' });

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
