'use strict';
const { verifyAccess } = require('../utils/jwt');
const AppError         = require('../errors/AppError');
const { User }         = require('../models');

/**
 * authenticate – verifies the Bearer access token.
 * Attaches req.user = User instance (safe fields).
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw AppError.unauthorized('No access token provided');

    const payload = verifyAccess(token);

    const user = await User.findOne({
      where:      { id: payload.sub, status: 'active' },
      attributes: { exclude: ['passwordHash', 'mfaSecret'] },
    });
    if (!user) throw AppError.unauthorized('User not found or inactive');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Invalid or expired access token'));
    }
    next(err);
  }
};

/**
 * authorize(...roles) – RBAC guard.
 * Must be used after authenticate.
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(AppError.forbidden(`Role '${req.user?.role}' is not permitted here`));
  }
  next();
};

/**
 * optionalAuth – attaches user if token present, never throws.
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      const payload = verifyAccess(token);
      const user = await User.findByPk(payload.sub, {
        attributes: { exclude: ['passwordHash', 'mfaSecret'] },
      });
      req.user = user;
    }
  } catch (_) { /* ignore */ }
  next();
};

module.exports = { authenticate, authorize, optionalAuth };
