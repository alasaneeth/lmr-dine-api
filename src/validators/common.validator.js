'use strict';
const { body } = require('express-validator');

// ── Invoice ───────────────────────────────────────────────────────────────────
const createInvoiceRules = [
  body('orderId').isInt({ min: 1 }).withMessage('Valid orderId required'),
  body('customerId').optional().isInt({ min: 1 }),
  body('taxAmount').optional().isFloat({ min: 0 }),
  body('discountAmount').optional().isFloat({ min: 0 }),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'transfer', 'credit'])
    .withMessage('Invalid payment method'),
  body('notes').optional().isString().isLength({ max: 500 }),
];

// ── Stock ─────────────────────────────────────────────────────────────────────
const stockRules = [
  body('name').trim().notEmpty().withMessage('Name required').isLength({ max: 150 }),
  body('unit').optional().isString().isLength({ max: 20 }),
  body('qty').optional().isFloat({ min: 0 }),
  body('minQty').optional().isFloat({ min: 0 }),
  body('price').optional().isFloat({ min: 0 }),
];

const adjustStockRules = [
  body('delta').isFloat().withMessage('delta must be a number (positive to add, negative to subtract)'),
];

// ── User ──────────────────────────────────────────────────────────────────────
const updateUserRules = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('email').optional().trim().isEmail(),
  body('role').optional().isIn(['admin', 'waiter', 'cashier', 'customer']),
];

const setStatusRules = [
  body('status').isIn(['active', 'inactive']).withMessage('status must be active or inactive'),
];

// ── Customer ──────────────────────────────────────────────────────────────────
const customerRules = [
  body('name').trim().notEmpty().withMessage('Name required').isLength({ max: 100 }),
  body('email').optional({ nullable: true }).trim().isEmail().withMessage('Valid email required'),
  body('phone').optional().isString().isLength({ max: 30 }),
  body('creditLimit').optional().isFloat({ min: 0 }),
  body('notes').optional().isString().isLength({ max: 500 }),
];

module.exports = {
  createInvoiceRules,
  stockRules,
  adjustStockRules,
  updateUserRules,
  setStatusRules,
  customerRules,
};
