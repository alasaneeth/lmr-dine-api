'use strict';

/**
 * Unified API response envelope.
 *
 * Success:  { success: true,  data: <payload>,  meta?: <pagination> }
 * Error:    { success: false, error: { code, message, errors? } }
 */

const success = (res, data = null, statusCode = 200, meta = null) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const created = (res, data) => success(res, data, 201);

const noContent = (res) => res.status(204).send();

const error = (res, message, statusCode = 500, code = 'INTERNAL_ERROR', errors = null) => {
  const body = { success: false, error: { code, message } };
  if (errors) body.error.errors = errors;
  return res.status(statusCode).json(body);
};

/**
 * Build pagination meta object from Sequelize count result.
 */
const paginationMeta = (total, page, limit) => ({
  total,
  page:       parseInt(page, 10),
  limit:      parseInt(limit, 10),
  totalPages: Math.ceil(total / limit),
  hasNext:    page * limit < total,
  hasPrev:    page > 1,
});

module.exports = { success, created, noContent, error, paginationMeta };
