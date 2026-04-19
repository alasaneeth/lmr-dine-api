'use strict';
const { body } = require('express-validator');

const createOrderRules = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('items must be a non-empty array'),
  body('items.*.menuItemId')
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid menuItemId'),
  body('items.*.qty')
    .isInt({ min: 1 })
    .withMessage('Each item qty must be >= 1'),
  body('tableNumber').optional().isString().isLength({ max: 20 }),
  body('customerId').optional().isInt({ min: 1 }),
  body('notes').optional().isString().isLength({ max: 500 }),
];

module.exports = { createOrderRules };
