'use strict';
const router    = require('express').Router();
const ctrl      = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate }  = require('../middlewares/validate.middleware');
const { createOrderRules } = require('../validators/order.validator');

router.use(authenticate);

router.get ('/',           authorize('admin','waiter','cashier'),          ctrl.list);
router.get ('/my',         authorize('customer','admin'),                   ctrl.myOrders);
router.get ('/:id',        authorize('admin','waiter','cashier','customer'),ctrl.getById);
router.post('/',           createOrderRules, validate,                      ctrl.create);
router.patch('/:id/advance', authorize('admin','waiter'),                  ctrl.advance);
router.patch('/:id/cancel',  authorize('admin','waiter','customer'),       ctrl.cancel);

module.exports = router;
