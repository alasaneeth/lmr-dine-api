'use strict';
const { Op }                         = require('sequelize');
const { fn, col, literal }           = require('sequelize');
const Base                           = require('./base.repository');
const { Invoice, Order, OrderItem, MenuItem, Customer } = require('../models');
const { paginate }                   = require('../utils/pagination');

const invoiceIncludes = [
  {
    model: Order, include: [
      { model: OrderItem, as: 'items',
        include: [{ model: MenuItem, as: 'menuItem', attributes: ['id','name','price','emoji'] }] },
    ],
  },
  { model: Customer, as: 'customer', attributes: ['id','name','email','phone'] },
];

class InvoiceRepository extends Base {
  constructor() { super(Invoice); }

  async list(query = {}) {
    const { page, limit, offset } = paginate(query);
    const where = {};
    if (query.status)     where.status     = query.status;
    if (query.customerId) where.customerId = query.customerId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt[Op.gte] = new Date(query.from);
      if (query.to)   where.createdAt[Op.lte] = new Date(query.to);
    }
    const { rows, count } = await Invoice.findAndCountAll({
      where,
      include: invoiceIncludes,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });
    return { items: rows, total: count, page, limit };
  }

  async findDetail(id) {
    return Invoice.findByPk(id, { include: invoiceIncludes });
  }

  async salesReport(query = {}) {
    const where = { status: 'paid' };
    if (query.from || query.to) {
      where.paidAt = {};
      if (query.from) where.paidAt[Op.gte] = new Date(query.from);
      if (query.to)   where.paidAt[Op.lte] = new Date(query.to);
    }
    return Invoice.findAll({
      where,
      attributes: [
        [fn('DATE', col('paid_at')), 'date'],
        [fn('COUNT', col('id')),     'invoiceCount'],
        [fn('SUM',   col('total')),  'revenue'],
      ],
      group:   [literal('DATE(paid_at)')],
      order:   [[literal('DATE(paid_at)'), 'ASC']],
      raw:     true,
    });
  }

  async nextInvoiceNumber() {
    const count = await Invoice.count();
    return `INV-${String(count + 1).padStart(5, '0')}`;
  }
}

module.exports = new InvoiceRepository();
