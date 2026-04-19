'use strict';
const path       = require('path');
const fs         = require('fs');
const menuRepo   = require('../repositories/menu.repository');
const AppError   = require('../errors/AppError');
const cfg        = require('../config/env');

const menuService = {
  async list(query) {
    return menuRepo.list(query);
  },

  async getById(id) {
    return menuRepo.findById(id);
  },

  async create(data, file) {
    const payload = { ...data };
    if (file) payload.imageUrl = `/uploads/menu/${file.filename}`;
    return menuRepo.create(payload);
  },

  async update(id, data, file) {
    const item = await menuRepo.findById(id);
    const payload = { ...data };

    if (file) {
      // Remove old image
      if (item.imageUrl) {
        const old = path.join(cfg.upload.dir, item.imageUrl.replace('/uploads/', ''));
        fs.unlink(old, () => {});
      }
      payload.imageUrl = `/uploads/menu/${file.filename}`;
    }

    return item.update(payload);
  },

  async remove(id) {
    const item = await menuRepo.findById(id);
    // Soft-delete: mark inactive instead of hard delete
    item.isActive = false;
    return item.save();
  },

  async adjustStock(id, qty) {
    if (typeof qty !== 'number') throw AppError.badRequest('qty must be a number');
    return menuRepo.adjustStock(id, qty);
  },
};

module.exports = menuService;
