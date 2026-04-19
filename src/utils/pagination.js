'use strict';

/**
 * Extracts pagination params from query string.
 * Returns { limit, offset, page } safe integers.
 */
const paginate = (query = {}) => {
  const page   = Math.max(1, parseInt(query.page,  10) || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

module.exports = { paginate };
