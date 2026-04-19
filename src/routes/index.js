'use strict';
const router = require('express').Router();

const authRoutes     = require('./auth.routes');
const menuRoutes     = require('./menu.routes');
const orderRoutes    = require('./order.routes');
const { invoiceRouter, stockRouter, userRouter, dashRouter, customerRouter } = require('./domain.routes');

router.use('/auth',       authRoutes);
router.use('/menu',       menuRoutes);
router.use('/orders',     orderRoutes);
router.use('/invoices',   invoiceRouter);
router.use('/stock',      stockRouter);
router.use('/users',      userRouter);
router.use('/dashboard',  dashRouter);
router.use('/customers',  customerRouter);

// Health check
router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

module.exports = router;
