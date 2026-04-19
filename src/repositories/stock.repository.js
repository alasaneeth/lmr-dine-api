'use strict';
const { Op }        = require('sequelize');
const Base          = require('./base.repository');
const { StockItem } = require('../models');
const { paginate }  = require('../utils/pagination');

class StockRepository extends Base {
  constructor() { super(StockItem); }

  async list(query = {}) {
    const { page, limit, offset } = paginate(query);
    const where = { isActive: true };
    if (query.search) where.name = { [Op.like]: `%${query.search}%` };
    const { rows, count } = await StockItem.findAndCountAll({
      where, limit, offset, order: [['name', 'ASC']],
    });
    return { items: rows, total: count, page, limit };
  }

  async getLowStock() {
    return StockItem.findAll({
      where: {
        isActive: true,
        qty: { [Op.lte]: StockItem.sequelize.col('min_qty') },
      },
      order: [['qty', 'ASC']],
    });
  }

  async adjust(id, delta) {
    const item     = await this.findById(id);
    const newQty   = parseFloat(item.qty) + parseFloat(delta);
    if (newQty < 0) throw new Error('Stock quantity cannot go below zero');
    item.qty = newQty;
    return item.save();
  }
}

module.exports = new StockRepository();
