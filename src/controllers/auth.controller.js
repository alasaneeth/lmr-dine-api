'use strict';
const authService         = require('../services/auth.service');
const { success, created } = require('../utils/response');
const cfg                 = require('../config/env');

// Bug fix: 'strict' blocks the cookie on cross-subdomain requests in production
// (e.g. app.example.com calling api.example.com). 'lax' is safe and broadly
// compatible; still HttpOnly + Secure in production so XSS cannot read it.
const COOKIE_OPTS = {
  httpOnly: true,
  secure:   cfg.env === 'production',
  sameSite: cfg.env === 'production' ? 'lax' : 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

const authController = {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      created(res, { user }, 'User registered successfully');
    } catch (e) { next(e); }
  },

  async login(req, res, next) {
    try {
      const meta   = { ip: req.ip, userAgent: req.headers['user-agent'] };
      const result = await authService.login(req.body, meta);

      if (result.requiresMfa) return success(res, { requiresMfa: true });

      res.cookie('rms_refresh', result.refreshToken, COOKIE_OPTS);
      success(res, { user: result.user, accessToken: result.accessToken });
    } catch (e) { next(e); }
  },

  async refresh(req, res, next) {
    try {
      const raw    = req.cookies?.rms_refresh;
      const meta   = { ip: req.ip, userAgent: req.headers['user-agent'] };
      const result = await authService.refresh(raw, meta);

      res.cookie('rms_refresh', result.refreshToken, COOKIE_OPTS);
      success(res, { user: result.user, accessToken: result.accessToken });
    } catch (e) { next(e); }
  },

  async logout(req, res, next) {
    try {
      await authService.logout(req.cookies?.rms_refresh);
      res.clearCookie('rms_refresh');
      success(res, null, 'Logged out');
    } catch (e) { next(e); }
  },

  async me(req, res, next) {
    try {
      const data = await authService.me(req.user.id);
      success(res, data);
    } catch (e) { next(e); }
  },

  async setupMfa(req, res, next) {
    try {
      const data = await authService.setupMfa(req.user.id);
      success(res, data);
    } catch (e) { next(e); }
  },

  async enableMfa(req, res, next) {
    try {
      const data = await authService.enableMfa(req.user.id, req.body.token);
      success(res, data);
    } catch (e) { next(e); }
  },

  async disableMfa(req, res, next) {
    try {
      const data = await authService.disableMfa(req.user.id);
      success(res, data);
    } catch (e) { next(e); }
  },
};

module.exports = authController;
