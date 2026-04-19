'use strict';
const { validationResult } = require('express-validator');

/**
 * Run after a chain of express-validator checks.
 * If errors exist, forward a typed error to the global handler.
 */
const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({
    field:   e.path || e.param,
    message: e.msg,
    value:   e.value,
  }));

  const err    = new Error('Validation failed');
  err.type     = 'VALIDATION';
  err.details  = details;
  next(err);
};

module.exports = { validate };
