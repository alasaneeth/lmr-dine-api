'use strict';
const orderService  = require('../services/order.service');
const { success, created, paginated } = require('../utils/response');

const orderController = {
  async list(req, res, next) {
    try {
      const { items, total, page, limit } = await orderService.list(req.query);
      paginated(res, items, total, page, limit);
    } catch (e) { next(e); }
  },

  async myOrders(req, res, next) {
    try {
      const { items, total, page, limit } = await orderService.myOrders(req.user.id, req.query);
      paginated(res, items, total, page, limit);
    } catch (e) { next(e); }
  },

  async getById(req, res, next) {
    try {
      const order = await orderService.getById(req.params.id);
      success(res, order);
    } catch (e) { next(e); }
  },

  async create(req, res, next) {
    try {
      const order = await orderService.create(req.body, req.user.id, req.app.get('io'));
      created(res, order, 'Order created');
    } catch (e) { next(e); }
  },

  async advance(req, res, next) {
    try {
      const order = await orderService.advance(req.params.id, req.user.id, req.app.get('io'));
      success(res, order, `Order advanced to ${order.status}`);
    } catch (e) { next(e); }
  },

  async cancel(req, res, next) {
    try {
      const order = await orderService.cancel(req.params.id, req.user.id, req.app.get('io'));
      success(res, order, 'Order cancelled');
    } catch (e) { next(e); }
  },
};

module.exports = orderController;
