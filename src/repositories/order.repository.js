'use strict';
const { Op }                              = require('sequelize');
const AppError                            = require('../errors/AppError');
const Base                                = require('./base.repository');
const { Order, OrderItem, MenuItem, User, Customer } = require('../models');
const { paginate }                        = require('../utils/pagination');

const orderIncludes = [
  { model: OrderItem, as: 'items',
    include: [{ model: MenuItem, as: 'menuItem', attributes: ['id','name','price','emoji'] }] },
  { model: User,     as: 'placedBy',  attributes: ['id','name','email','role'] },
  { model: Customer, as: 'customer',  attributes: ['id','name','email','phone'] },
];

class OrderRepository extends Base {
  constructor() { super(Order); }

  async list(query = {}) {
    const { page, limit, offset } = paginate(query);
    const where = {};
    if (query.status)     where.status     = query.status;
    if (query.customerId) where.customerId = query.customerId;
    if (query.userId)     where.userId     = query.userId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt[Op.gte] = new Date(query.from);
      if (query.to)   where.createdAt[Op.lte] = new Date(query.to);
    }
    const { rows, count } = await Order.findAndCountAll({
      where,
      include: orderIncludes,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });
    return { items: rows, total: count, page, limit };
  }

  async findDetail(id) {
    const order = await Order.findByPk(id, { include: orderIncludes });
    if (!order) throw new AppError(`Order #${id} not found`, 404, 'NOT_FOUND');
    return order;
  }

  async nextOrderNumber() {
    const count = await Order.count();
    return `ORD-${String(count + 1).padStart(5, '0')}`;
  }
}

module.exports = new OrderRepository();
