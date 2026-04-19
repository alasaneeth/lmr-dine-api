'use strict';
const { body } = require('express-validator');

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'waiter', 'cashier', 'customer'])
    .withMessage('Invalid role'),
];

const enableMfaRules = [
  body('token').notEmpty().isLength({ min: 6, max: 6 }).withMessage('6-digit TOTP required'),
];

module.exports = { loginRules, registerRules, enableMfaRules };
