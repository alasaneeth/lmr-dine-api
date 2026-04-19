'use strict';
const router      = require('express').Router();
const ctrl        = require('../controllers/auth.controller');
const { authenticate }  = require('../middlewares/auth.middleware');
const { validate }      = require('../middlewares/validate.middleware');
const { loginRules, registerRules, enableMfaRules } = require('../validators/auth.validator');

router.post('/register', registerRules, validate, ctrl.register);
router.post('/login',    loginRules,    validate, ctrl.login);
router.post('/refresh',                           ctrl.refresh);
router.post('/logout',                            ctrl.logout);

// Protected
router.get ('/me',          authenticate, ctrl.me);
router.get ('/mfa/setup',   authenticate, ctrl.setupMfa);
router.post('/mfa/enable',  authenticate, enableMfaRules, validate, ctrl.enableMfa);
router.post('/mfa/disable', authenticate, ctrl.disableMfa);

module.exports = router;
