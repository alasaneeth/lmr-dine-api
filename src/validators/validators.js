'use strict';
const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

/**
 * Generic validator factory.
 * Returns an Express middleware that validates req.body against schema.
 */
const validate = (schema, target = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[target], { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    return next(new ValidationError('Validation failed', errors));
  }
  req[target] = value; // replace with sanitised value
  next();
};

// ── Auth ──────────────────────────────────────────────────────────────────────
const authSchemas = {
  register: Joi.object({
    name:     Joi.string().min(2).max(100).required(),
    email:    Joi.string().email().lowercase().required(),
    password: Joi.string().min(8).max(128).required(),
    role:     Joi.string().valid('customer', 'waiter', 'cashier').default('customer'),
  }),
  login: Joi.object({
    email:    Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
    mfaToken: Joi.string().length(6).pattern(/^\d+$/).optional(),
  }),
  refresh: Joi.object({
    refreshToken: Joi.string().required(),
  }),
  enableMfa: Joi.object({
    token: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),
};

// ── Menu ──────────────────────────────────────────────────────────────────────
const menuSchemas = {
  create: Joi.object({
    categoryId:   Joi.string().uuid().required(),
    name:         Joi.string().min(2).max(120).required(),
    price:        Joi.number().positive().precision(2).required(),
    emoji:        Joi.string().max(10).default('🍽'),
    stock:        Joi.number().integer().min(0).default(0),
    isAvailable:  Joi.boolean().default(true),
    description:  Joi.string().max(500).optional().allow(''),
  }),
  update: Joi.object({
    categoryId:   Joi.string().uuid(),
    name:         Joi.string().min(2).max(120),
    price:        Joi.number().positive().precision(2),
    emoji:        Joi.string().max(10),
    stock:        Joi.number().integer().min(0),
    isAvailable:  Joi.boolean(),
    description:  Joi.string().max(500).allow(''),
  }),
  adjustStock: Joi.object({
    qty: Joi.number().integer().required(),
  }),
};

// ── Order ─────────────────────────────────────────────────────────────────────
const orderSchemas = {
  create: Joi.object({
    tableNo:      Joi.string().max(20).required(),
    customerName: Joi.string().max(100).optional().allow(''),
    notes:        Joi.string().max(500).optional().allow(''),
    items: Joi.array().items(
      Joi.object({
        menuItemId: Joi.string().uuid().required(),
        qty:        Joi.number().integer().min(1).required(),
      })
    ).min(1).required(),
  }),
};

// ── Invoice ───────────────────────────────────────────────────────────────────
const invoiceSchemas = {
  create: Joi.object({
    orderId:       Joi.string().uuid().required(),
    paymentMethod: Joi.string().valid('cash', 'card', 'online').required(),
  }),
};

// ── Stock ─────────────────────────────────────────────────────────────────────
const stockSchemas = {
  create: Joi.object({
    name:   Joi.string().min(2).max(100).required(),
    unit:   Joi.string().max(20).required(),
    qty:    Joi.number().min(0).default(0),
    minQty: Joi.number().min(0).default(0),
    price:  Joi.number().min(0).default(0),
  }),
  adjust: Joi.object({
    delta: Joi.number().required(),
  }),
};

// ── User ──────────────────────────────────────────────────────────────────────
const userSchemas = {
  update: Joi.object({
    name:   Joi.string().min(2).max(100),
    status: Joi.string().valid('active', 'inactive', 'suspended'),
    role:   Joi.string().valid('admin', 'waiter', 'cashier', 'customer'),
  }),
};

module.exports = {
  validate,
  authSchemas,
  menuSchemas,
  orderSchemas,
  invoiceSchemas,
  stockSchemas,
  userSchemas,
};
