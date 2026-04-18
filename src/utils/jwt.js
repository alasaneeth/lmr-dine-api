'use strict';
const jwt  = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { AuthenticationError } = require('./errors');

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY  = process.env.JWT_ACCESS_EXPIRES_IN  || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Sign an access token containing the user's id, role, and permissions.
 */
const signAccessToken = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
    jwtid:     uuidv4(),
    issuer:    'restoms-api',
    audience:  'restoms-client',
  });

/**
 * Sign a refresh token — minimal payload, long expiry.
 */
const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId, jti: uuidv4() }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
    issuer:    'restoms-api',
    audience:  'restoms-client',
  });

/**
 * Verify and decode an access token.
 * Throws AuthenticationError on failure.
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET, {
      issuer:   'restoms-api',
      audience: 'restoms-client',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AuthenticationError('Access token expired');
    }
    throw new AuthenticationError('Invalid access token');
  }
};

/**
 * Verify and decode a refresh token.
 * Throws AuthenticationError on failure.
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET, {
      issuer:   'restoms-api',
      audience: 'restoms-client',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AuthenticationError('Refresh token expired — please log in again');
    }
    throw new AuthenticationError('Invalid refresh token');
  }
};

/** Convert a JWT expiry string (e.g. "7d", "15m") to a JS Date. */
const expiryToDate = (expiry) => {
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expiry}`);
  const seconds = parseInt(match[1], 10) * units[match[2]];
  return new Date(Date.now() + seconds * 1000);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  expiryToDate,
  REFRESH_EXPIRY,
};
