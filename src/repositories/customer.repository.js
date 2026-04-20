'use strict';
const { Op }        = require('sequelize');
const { fn, col, literal } = require('sequelize');
const Base          = require('./base.repository');
const { Customer, Invoice, Order } = require('../models');
const { paginate }  = require('../utils/pagination');

class CustomerRepository extends Base {
  constructor() { super(Customer); }

  async list(query = {}) {
    const { page, limit, offset } = paginate(query);
    const where = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where[Op.or] = [
        { name:  { [Op.like]: `%${query.search}%` } },
        { email: { [Op.like]: `%${query.search}%` } },
        { phone: { [Op.like]: `%${query.search}%` } },
      ];
    }
    const { rows, count } = await Customer.findAndCountAll({
      where, limit, offset, order: [['name', 'ASC']],
    });
    return { items: rows, total: count, page, limit };
  }

  /** Sales report – total spend per customer in date range */
  async salesReport(query = {}) {
    const { page, limit, offset } = paginate(query);
    const invoiceWhere = { status: 'paid' };
    if (query.from || query.to) {
      invoiceWhere.paidAt = {};
      if (query.from) invoiceWhere.paidAt[Op.gte] = new Date(query.from);
      if (query.to)   invoiceWhere.paidAt[Op.lte] = new Date(query.to);
    }
    const customerWhere = {};
    // Bug fix: support filtering by a single customer (for detail endpoints)
    if (query.customerId) customerWhere.id = query.customerId;
    if (query.search) {
      customerWhere[Op.or] = [
        { name:  { [Op.like]: `%${query.search}%` } },
        { email: { [Op.like]: `%${query.search}%` } },
      ];
    }
    const { rows, count } = await Customer.findAndCountAll({
      where: customerWhere,
      include: [{
        model:    Invoice,
        as:       'Invoices',
        where:    invoiceWhere,
        required: false,
        attributes: [],
      }],
      attributes: {
        include: [
          [fn('COUNT', col('Invoices.id')),    'invoiceCount'],
          [fn('SUM',   col('Invoices.total')), 'periodSpend'],
        ],
      },
      group:    ['Customer.id'],
      limit,
      offset,
      subQuery: false,
      order:    [[literal('periodSpend'), 'DESC']],
      distinct: true,
    });
    return { items: rows, total: count, page, limit };
  }

  /** Credit report – outstanding balances */
  async creditReport(query = {}) {
    const { page, limit, offset } = paginate(query);
    const where = { outstandingBalance: { [Op.gt]: 0 } };
    // Bug fix: support filtering by a single customer (for detail endpoints)
    if (query.customerId) where.id = query.customerId;
    if (query.search) {
      where[Op.or] = [
        { name:  { [Op.like]: `%${query.search}%` } },
        { email: { [Op.like]: `%${query.search}%` } },
      ];
    }
    const { rows, count } = await Customer.findAndCountAll({
      where, limit, offset, order: [['outstandingBalance', 'DESC']],
    });
    return { items: rows, total: count, page, limit };
  }

  /** Paid invoice history for a single customer */
  async paymentHistory(customerId, query = {}) {
    const { page, limit, offset } = paginate(query);
    const { Invoice } = require('../models');
    const where = { customerId };
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt[Op.gte] = new Date(query.from);
      if (query.to)   where.createdAt[Op.lte] = new Date(query.to);
    }
    const { rows, count } = await Invoice.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    return { items: rows, total: count, page, limit };
  }

  /** Summary stats for the reports dashboard */
  async reportSummary(query = {}) {
    const invoiceWhere = { status: 'paid' };
    if (query.from || query.to) {
      invoiceWhere.paidAt = {};
      if (query.from) invoiceWhere.paidAt[Op.gte] = new Date(query.from);
      if (query.to)   invoiceWhere.paidAt[Op.lte] = new Date(query.to);
    }
    const [totalCustomers, activeCustomers, revenueRow] = await Promise.all([
      Customer.count(),
      Customer.count({ where: { status: 'active' } }),
      Invoice.findOne({
        where:      invoiceWhere,
        attributes: [[fn('SUM', col('total')), 'total']],
        raw:        true,
      }),
    ]);
    return {
      totalCustomers,
      activeCustomers,
      periodRevenue: parseFloat(revenueRow?.total || 0),
    };
  }
}

module.exports = new CustomerRepository();
