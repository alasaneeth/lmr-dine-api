'use strict';
const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');

const {
  authenticate, authorize, authLimiter, handleValidation,
} = require('../middleware/middleware');
const {
  AuthController, MenuController, OrderController,
  InvoiceController, StockController, UserController, DashboardController,
} = require('../controllers/controllers');
const { validate, authSchemas, menuSchemas, orderSchemas, invoiceSchemas, stockSchemas, userSchemas } =
  require('../validators/validators');

const router = express.Router();

// ── Multer config (image uploads) ────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits:    { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10)) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    cb(null, allowed.test(file.mimetype));
  },
});

// ── Auth routes ───────────────────────────────────────────────────────────────
router.post('/auth/register', authLimiter, validate(authSchemas.register),  AuthController.register);
router.post('/auth/login',    authLimiter, validate(authSchemas.login),     AuthController.login);
router.post('/auth/refresh',  authLimiter,                                   AuthController.refresh);
router.post('/auth/logout',   authenticate,                                  AuthController.logout);
router.get( '/auth/me',       authenticate,                                  AuthController.me);
router.get( '/auth/mfa/setup',    authenticate, AuthController.setupMfa);
router.post('/auth/mfa/enable',   authenticate, validate(authSchemas.enableMfa), AuthController.enableMfa);
router.post('/auth/mfa/disable',  authenticate, AuthController.disableMfa);

// ── Menu routes ───────────────────────────────────────────────────────────────
router.get( '/menu',      MenuController.getAll);               // public
router.get( '/menu/:id',  MenuController.getOne);               // public
router.post('/menu',      authenticate, authorize('admin'), upload.single('image'), validate(menuSchemas.create),  MenuController.create);
router.put( '/menu/:id',  authenticate, authorize('admin'), upload.single('image'), validate(menuSchemas.update),  MenuController.update);
router.delete('/menu/:id',authenticate, authorize('admin'),                                                        MenuController.remove);
router.patch('/menu/:id/stock', authenticate, authorize('admin', 'waiter'), validate(menuSchemas.adjustStock),     MenuController.adjustStock);

// ── Order routes ──────────────────────────────────────────────────────────────
router.get( '/orders',         authenticate, authorize('admin', 'waiter', 'cashier'), OrderController.getAll);
router.get( '/orders/my',      authenticate,                                           async (req, res, next) => {
  req.query.userId = req.user.sub; OrderController.getAll(req, res, next);
});
router.get( '/orders/:id',     authenticate, OrderController.getOne);
router.post('/orders',         authenticate, validate(orderSchemas.create), OrderController.create);
router.patch('/orders/:id/advance', authenticate, authorize('admin', 'waiter'), OrderController.advance);
router.patch('/orders/:id/cancel',  authenticate, authorize('admin', 'waiter'), OrderController.cancel);

// ── Invoice routes ────────────────────────────────────────────────────────────
router.get( '/invoices',            authenticate, authorize('admin', 'cashier'), InvoiceController.getAll);
router.get( '/invoices/sales-report', authenticate, authorize('admin'),          InvoiceController.salesReport);
router.get( '/invoices/:id',        authenticate, authorize('admin', 'cashier'), InvoiceController.getOne);
router.post('/invoices',            authenticate, authorize('admin', 'cashier'), validate(invoiceSchemas.create), InvoiceController.create);
router.patch('/invoices/:id/pay',   authenticate, authorize('admin', 'cashier'), InvoiceController.markPaid);

// ── Stock routes ──────────────────────────────────────────────────────────────
router.get( '/stock',             authenticate, authorize('admin', 'waiter'), StockController.getAll);
router.get( '/stock/low',         authenticate, authorize('admin', 'waiter'), StockController.getLowStock);
router.post('/stock',             authenticate, authorize('admin', 'waiter'), validate(stockSchemas.create), StockController.create);
router.put( '/stock/:id',         authenticate, authorize('admin', 'waiter'), StockController.update);
router.patch('/stock/:id/adjust', authenticate, authorize('admin', 'waiter'), validate(stockSchemas.adjust), StockController.adjust);
router.delete('/stock/:id',       authenticate, authorize('admin'),           StockController.remove);

// ── User routes ───────────────────────────────────────────────────────────────
router.get( '/users',          authenticate, authorize('admin'), UserController.getAll);
router.get( '/users/:id',      authenticate, UserController.getOne);
router.put( '/users/:id',      authenticate, authorize('admin'), validate(userSchemas.update), UserController.update);
router.patch('/users/:id/status', authenticate, authorize('admin'), UserController.setStatus);
router.delete('/users/:id',    authenticate, authorize('admin'), UserController.remove);

// ── Dashboard routes ──────────────────────────────────────────────────────────
router.get('/dashboard/stats',        authenticate, authorize('admin'), DashboardController.adminStats);
router.get('/dashboard/weekly-sales', authenticate, authorize('admin', 'cashier'), DashboardController.weeklySales);

module.exports = router;
