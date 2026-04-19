'use strict';
const menuService               = require('../services/menu.service');
const { success, created, noContent, paginated } = require('../utils/response');

const menuController = {
  async list(req, res, next) {
    try {
      const { items, total, page, limit } = await menuService.list(req.query);
      paginated(res, items, total, page, limit);
    } catch (e) { next(e); }
  },

  async getById(req, res, next) {
    try {
      const item = await menuService.getById(req.params.id);
      success(res, item);
    } catch (e) { next(e); }
  },

  async create(req, res, next) {
    try {
      const item = await menuService.create(req.body, req.file);
      created(res, item, 'Menu item created');
    } catch (e) { next(e); }
  },

  async update(req, res, next) {
    try {
      const item = await menuService.update(req.params.id, req.body, req.file);
      success(res, item, 'Menu item updated');
    } catch (e) { next(e); }
  },

  async remove(req, res, next) {
    try {
      await menuService.remove(req.params.id);
      noContent(res);
    } catch (e) { next(e); }
  },

  async adjustStock(req, res, next) {
    try {
      const item = await menuService.adjustStock(req.params.id, req.body.qty);
      success(res, item, 'Stock adjusted');
    } catch (e) { next(e); }
  },
};

module.exports = menuController;
