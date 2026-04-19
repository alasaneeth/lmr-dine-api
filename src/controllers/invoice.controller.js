'use strict';
const invoiceService = require('../services/invoice.service');
const { success, created, paginated } = require('../utils/response');

const invoiceController = {
  async list(req, res, next) {
    try {
      const { items, total, page, limit } = await invoiceService.list(req.query);
      paginated(res, items, total, page, limit);
    } catch (e) { next(e); }
  },

  async getById(req, res, next) {
    try {
      const inv = await invoiceService.getById(req.params.id);
      success(res, inv);
    } catch (e) { next(e); }
  },

  async create(req, res, next) {
    try {
      const inv = await invoiceService.create(req.body, req.user.id);
      created(res, inv, 'Invoice created');
    } catch (e) { next(e); }
  },

  async markPaid(req, res, next) {
    try {
      const inv = await invoiceService.markPaid(req.params.id, req.user.id);
      success(res, inv, 'Invoice marked as paid');
    } catch (e) { next(e); }
  },

  async salesReport(req, res, next) {
    try {
      const data = await invoiceService.salesReport(req.query);
      success(res, data);
    } catch (e) { next(e); }
  },
};

module.exports = invoiceController;
