'use strict';
const { stockService, userService, dashboardService, customerService } = require('../services/domain.services');
const { success, created, noContent, paginated } = require('../utils/response');

// ── Stock Controller ──────────────────────────────────────────────────────────
const stockController = {
  async list(req, res, next) {
    try {
      const { items, total, page, limit } = await stockService.list(req.query);
      paginated(res, items, total, page, limit);
    } catch (e) { next(e); }
  },
  async getLow(req, res, next) {
    try { success(res, await stockService.getLow()); } catch (e) { next(e); }
  },
  async getById(req, res, next) {
    try { success(res, await stockService.getById(req.params.id)); } catch (e) { next(e); }
  },
  async create(req, res, next) {
    try { created(res, await stockService.create(req.body), 'Stock item created'); } catch (e) { next(e); }
  },
  async update(req, res, next) {
    try { success(res, await stockService.update(req.params.id, req.body)); } catch (e) { next(e); }
  },
  async adjust(req, res, next) {
    try { success(res, await stockService.adjust(req.params.id, req.body.delta), 'Stock adjusted'); } catch (e) { next(e); }
  },
  async remove(req, res, next) {
    try { await stockService.remove(req.params.id); noContent(res); } catch (e) { next(e); }
  },
};

// ── User Controller ───────────────────────────────────────────────────────────
const userController = {
  async list(req, res, next) {
    try {
      const { items, total, page, limit } = await userService.list(req.query);
      paginated(res, items, total, page, limit);
    } catch (e) { next(e); }
  },
  async getById(req, res, next) {
    try { success(res, await userService.getById(req.params.id)); } catch (e) { next(e); }
  },
  async update(req, res, next) {
    try { success(res, await userService.update(req.params.id, req.body, req.user.id)); } catch (e) { next(e); }
  },
  async setStatus(req, res, next) {
    try { success(res, await userService.setStatus(req.params.id, req.body.status, req.user.id)); } catch (e) { next(e); }
  },
  async remove(req, res, next) {
    try { await userService.remove(req.params.id, req.user.id); noContent(res); } catch (e) { next(e); }
  },
};

// ── Dashboard Controller ──────────────────────────────────────────────────────
const dashboardController = {
  async adminStats(req, res, next) {
    try { success(res, await dashboardService.adminStats()); } catch (e) { next(e); }
  },
  async weeklySales(req, res, next) {
    try { success(res, await dashboardService.weeklySales()); } catch (e) { next(e); }
  },
};

// ── Customer Controller ───────────────────────────────────────────────────────
const customerController = {
  async list(req, res, next) {
    try {
      const { items, total, page, limit } = await customerService.list(req.query);
      paginated(res, items, total, page, limit);
    } catch (e) { next(e); }
  },
  async getById(req, res, next) {
    try { success(res, await customerService.getById(req.params.id)); } catch (e) { next(e); }
  },
  async create(req, res, next) {
    try { created(res, await customerService.create(req.body), 'Customer created'); } catch (e) { next(e); }
  },
  async update(req, res, next) {
    try { success(res, await customerService.update(req.params.id, req.body)); } catch (e) { next(e); }
  },
  async remove(req, res, next) {
    try { await customerService.remove(req.params.id); noContent(res); } catch (e) { next(e); }
  },
  async setStatus(req, res, next) {
    try { success(res, await customerService.setStatus(req.params.id, req.body.status)); } catch (e) { next(e); }
  },
  // Reports
  async salesReport(req, res, next) {
    try { success(res, await customerService.salesReport(req.query)); } catch (e) { next(e); }
  },
  async customerSalesDetail(req, res, next) {
    // Bug fix: was calling getById() – must pass customerId to scope the sales report
    try { success(res, await customerService.salesReport({ ...req.query, customerId: req.params.id })); } catch (e) { next(e); }
  },
  async creditReport(req, res, next) {
    try { success(res, await customerService.creditReport(req.query)); } catch (e) { next(e); }
  },
  async customerCreditDetail(req, res, next) {
    // Bug fix: was calling getById() – must pass customerId to scope the credit report
    try { success(res, await customerService.creditReport({ ...req.query, customerId: req.params.id })); } catch (e) { next(e); }
  },
  async reportSummary(req, res, next) {
    try { success(res, await customerService.reportSummary(req.query)); } catch (e) { next(e); }
  },
  async customerPaymentHistory(req, res, next) {
    try {
      const { items, total, page, limit } = await customerService.paymentHistory(req.params.id, req.query);
      paginated(res, items, total, page, limit);
    } catch (e) { next(e); }
  },
};

module.exports = { stockController, userController, dashboardController, customerController };
