'use strict';
const router    = require('express').Router();
const ctrl      = require('../controllers/menu.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate }  = require('../middlewares/validate.middleware');
const { upload }    = require('../middlewares/upload.middleware');
const { menuRules, stockAdjustRules } = require('../validators/menu.validator');

// Public – anyone can browse the menu (optionalAuth handled in app layer)
router.get ('/',     ctrl.list);
router.get ('/:id',  ctrl.getById);

// Protected – admin only for mutations
router.post  ('/',           authenticate, authorize('admin'), upload.single('image'), menuRules, validate, ctrl.create);
router.put   ('/:id',        authenticate, authorize('admin'), upload.single('image'), menuRules, validate, ctrl.update);
router.delete('/:id',        authenticate, authorize('admin'), ctrl.remove);
router.patch ('/:id/stock',  authenticate, authorize('admin', 'waiter'), stockAdjustRules, validate, ctrl.adjustStock);

module.exports = router;
