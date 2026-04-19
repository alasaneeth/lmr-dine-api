'use strict';
const { Op }       = require('sequelize');
const Base         = require('./base.repository');
const { MenuItem } = require('../models');
const { paginate } = require('../utils/pagination');

class MenuRepository extends Base {
  constructor() { super(MenuItem); }

  async list(query = {}) {
    const { page, limit, offset } = paginate(query);
    const where = { isActive: true };
    if (query.category) where.category = query.category;
    if (query.search) {
      where.name = { [Op.like]: `%${query.search}%` };
    }
    const { rows, count } = await MenuItem.findAndCountAll({
      where,
      limit,
      offset,
      order: [['section', 'ASC'], ['name', 'ASC']],
    });
    return { items: rows, total: count, page, limit };
  }

  async adjustStock(id, qty) {
    const item = await this.findById(id);
    const newStock = item.stock + qty;
    if (newStock < 0) throw new Error('Insufficient stock');
    item.stock = newStock;
    return item.save();
  }
}

module.exports = new MenuRepository();
