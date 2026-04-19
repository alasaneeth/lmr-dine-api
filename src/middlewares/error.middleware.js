'use strict';
const logger   = require('../utils/logger');
const AppError = require('../errors/AppError');
const { error: errRes } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  // Log everything
  logger.error({
    message:    err.message,
    stack:      err.stack,
    path:       req.path,
    method:     req.method,
    statusCode: err.statusCode || 500,
  });

  // Known operational error
  if (err instanceof AppError) {
    return errRes(res, err.message, err.statusCode, err.code, err.details);
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors?.map((e) => ({ field: e.path, message: e.message })) || [];
    return errRes(res, 'Validation failed', 422, 'VALIDATION_ERROR', details);
  }

  // JWT errors (shouldn't reach here if auth mw is correct, but safety net)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return errRes(res, 'Invalid or expired token', 401, 'UNAUTHORIZED');
  }

  // express-validator errors forwarded via validationResult
  if (err.type === 'VALIDATION') {
    return errRes(res, 'Validation failed', 400, 'BAD_REQUEST', err.details);
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errRes(res, 'File too large', 400, 'FILE_TOO_LARGE');
  }

  // Unknown / programmer error – don't leak details in prod
  const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return errRes(res, msg, 500, 'INTERNAL_ERROR');
};
