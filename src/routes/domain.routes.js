'use strict';
const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate }  = require('../middlewares/validate.middleware');
const invCtrl  = require('../controllers/invoice.controller');
const { stockController: sCtrl, userController: uCtrl,
        dashboardController: dCtrl, customerController: cCtrl } = require('../controllers/domain.controllers');
const { createInvoiceRules, stockRules, adjustStockRules,
        updateUserRules, setStatusRules, customerRules } = require('../validators/common.validator');

// ── Invoices /api/v1/invoices ─────────────────────────────────────────────────
const invoiceRouter = express.Router();
invoiceRouter.use(authenticate);
invoiceRouter.get ('/',               authorize('admin','cashier'),         invCtrl.list);
invoiceRouter.get ('/sales-report',   authorize('admin','cashier'),         invCtrl.salesReport);
invoiceRouter.get ('/:id',            authorize('admin','cashier'),         invCtrl.getById);
invoiceRouter.post('/',               authorize('admin','cashier'), createInvoiceRules, validate, invCtrl.create);
invoiceRouter.patch('/:id/pay',       authorize('admin','cashier'),         invCtrl.markPaid);

// ── Stock /api/v1/stock ───────────────────────────────────────────────────────
const stockRouter = express.Router();
stockRouter.use(authenticate);
stockRouter.get ('/',          authorize('admin','waiter'),          sCtrl.list);
stockRouter.get ('/low',       authorize('admin','waiter'),          sCtrl.getLow);
stockRouter.get ('/:id',       authorize('admin','waiter'),          sCtrl.getById);
stockRouter.post('/',          authorize('admin','waiter'), stockRules, validate, sCtrl.create);
stockRouter.put ('/:id',       authorize('admin','waiter'), stockRules, validate, sCtrl.update);
stockRouter.patch('/:id/adjust', authorize('admin','waiter'), adjustStockRules, validate, sCtrl.adjust);
stockRouter.delete('/:id',     authorize('admin'),                   sCtrl.remove);

// ── Users /api/v1/users ───────────────────────────────────────────────────────
const userRouter = express.Router();
userRouter.use(authenticate, authorize('admin'));
userRouter.get ('/',              uCtrl.list);
userRouter.get ('/:id',           uCtrl.getById);
userRouter.put ('/:id',           updateUserRules, validate, uCtrl.update);
userRouter.patch('/:id/status',   setStatusRules,  validate, uCtrl.setStatus);
userRouter.delete('/:id',         uCtrl.remove);

// ── Dashboard /api/v1/dashboard ───────────────────────────────────────────────
const dashRouter = express.Router();
dashRouter.use(authenticate, authorize('admin','cashier'));
dashRouter.get('/stats',        dCtrl.adminStats);
dashRouter.get('/weekly-sales', dCtrl.weeklySales);

// ── Customers /api/v1/customers ───────────────────────────────────────────────
const customerRouter = express.Router();
customerRouter.use(authenticate);
customerRouter.get ('/',                         authorize('admin','cashier'),  cCtrl.list);
customerRouter.get ('/reports/sales',            authorize('admin','cashier'),  cCtrl.salesReport);
customerRouter.get ('/reports/credit',           authorize('admin','cashier'),  cCtrl.creditReport);
customerRouter.get ('/reports/summary',          authorize('admin','cashier'),  cCtrl.reportSummary);
customerRouter.get ('/:id',                      authorize('admin','cashier'),  cCtrl.getById);
customerRouter.get ('/:id/reports/sales',        authorize('admin','cashier'),  cCtrl.customerSalesDetail);
customerRouter.get ('/:id/reports/credit',       authorize('admin','cashier'),  cCtrl.customerCreditDetail);
customerRouter.get ('/:id/payments',             authorize('admin','cashier'),  cCtrl.getById);
customerRouter.post('/',                         authorize('admin','cashier'), customerRules, validate, cCtrl.create);
customerRouter.put ('/:id',                      authorize('admin','cashier'), customerRules, validate, cCtrl.update);
customerRouter.patch('/:id/status',              authorize('admin'), setStatusRules, validate, cCtrl.setStatus);
customerRouter.delete('/:id',                    authorize('admin'),            cCtrl.remove);

module.exports = { invoiceRouter, stockRouter, userRouter, dashRouter, customerRouter };
