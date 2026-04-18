'use strict';
const rateLimit   = require('express-rate-limit');
const morgan      = require('morgan');
const { body, validationResult } = require('express-validator');
const { verifyAccessToken }      = require('../utils/jwt');
const { httpLogStream, logger }  = require('../utils/logger');
const {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  AppError,
} = require('../utils/errors');
const R = require('../utils/response');

// ── 1. HTTP Request Logger ────────────────────────────────────────────────────
const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream: httpLogStream }
);

// ── 2. Authenticate (JWT Bearer) ─────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AuthenticationError('No token provided'));
  }
  try {
    const token   = header.slice(7);
    const payload = verifyAccessToken(token);
    req.user = payload;          // { sub, email, role, name }
    next();
  } catch (err) {
    next(err);
  }
};

// Optional auth – attaches user if token present, doesn't fail if missing
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.slice(7));
    } catch (_) { /* ignore */ }
  }
  next();
};

// ── 3. RBAC – Role-Based Access Control ──────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AuthenticationError());
  if (!roles.includes(req.user.role)) return next(new AuthorizationError());
  next();
};

// ── 4. Ownership guard – user can only access their own resources (or admin) ──
const ownerOrAdmin = (paramKey = 'id') => (req, res, next) => {
  const resourceUserId = req.params[paramKey] || req.body.userId;
  if (req.user.role === 'admin' || req.user.sub === resourceUserId) return next();
  next(new AuthorizationError());
};

// ── 5. Rate Limiters ──────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max:      parseInt(process.env.RATE_LIMIT_MAX        || '100',   10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts' } },
});

// ── 6. express-validator result handler ──────────────────────────────────────
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationError('Validation failed', errors.array()));
  }
  next();
};

// ── 7. Global Error Handler ───────────────────────────────────────────────────
// Must be registered LAST in Express middleware chain.
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return R.error(res, 'A record with that value already exists', 409, 'CONFLICT');
  }
  if (err.name === 'SequelizeValidationError') {
    return R.error(res, 'Database validation error', 422, 'VALIDATION_ERROR',
      err.errors.map((e) => ({ field: e.path, message: e.message })));
  }

  if (err instanceof AppError) {
    logger.warn({ event: 'app.error', code: err.code, message: err.message, url: req.url });
    return R.error(res, err.message, err.statusCode, err.code,
      err instanceof ValidationError ? err.errors : null);
  }

  // Unexpected error
  logger.error({ event: 'unhandled.error', message: err.message, stack: err.stack, url: req.url });
  const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return R.error(res, msg, 500, 'INTERNAL_ERROR');
};

// ── 8. 404 handler ────────────────────────────────────────────────────────────
const notFound = (req, res) => {
  R.error(res, `Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
};

module.exports = {
  requestLogger,
  authenticate,
  optionalAuth,
  authorize,
  ownerOrAdmin,
  globalLimiter,
  authLimiter,
  handleValidation,
  errorHandler,
  notFound,
};
