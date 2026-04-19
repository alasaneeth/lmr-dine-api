'use strict';
const { body } = require('express-validator');

const menuRules = [
  body('name').trim().notEmpty().withMessage('Name required').isLength({ max: 150 }),
  body('category').trim().notEmpty().withMessage('Category required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('emoji').optional().isLength({ max: 10 }),
  body('section').optional().isInt({ min: 0 }),
];

const stockAdjustRules = [
  body('qty').isInt().withMessage('qty must be an integer (positive to add, negative to subtract)'),
];

module.exports = { menuRules, stockAdjustRules };
