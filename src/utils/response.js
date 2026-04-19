'use strict';

/**
 * All API responses share this envelope:
 *   { success: true,  data: {...}, message: "..." }
 *   { success: false, error: { message: "...", code: "...", details: [] } }
 *
 * The frontend unwraps via: res.data.data
 */

const success = (res, data = null, message = 'OK', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const created = (res, data = null, message = 'Created') =>
  success(res, data, message, 201);

const noContent = (res) => res.status(204).send();

const paginated = (res, items, total, page, limit) =>
  success(res, { items, total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) });

const error = (res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = []) =>
  res.status(statusCode).json({
    success: false,
    error: { message, code, details, timestamp: new Date().toISOString() },
  });

module.exports = { success, created, noContent, paginated, error };
