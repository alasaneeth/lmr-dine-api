'use strict';
const { Op }           = require('sequelize');
const BaseRepository   = require('./base.repository');
const {
  MenuItem, Category,
  Order, OrderItem,
  Invoice, StockItem,
  RefreshToken, Notification,
} = require('../models');
const bcrypt = require('bcryptjs');

// ── MenuItemRepository ────────────────────────────────────────────────────────
class MenuItemRepository extends BaseRepository {
  constructor() { super(MenuItem, 'MenuItem'); }

  findWithCategory(options = {}) {
    return MenuItem.findAll({ ...options, include: [{ model: Category, as: 'category' }] });
  }

  findPaginated({ offset, limit, search, categoryId, isAvailable }) {
    const where = {};
    if (categoryId  !== undefined) where.category_id  = categoryId;
    if (isAvailable !== undefined) where.is_available = isAvailable;
    if (search) where.name = { [Op.like]: `%${search}%` };
    return MenuItem.findAndCountAll({
      where, limit, offset,
      include: [{ model: Category, as: 'category' }],
      order:   [['created_at', 'DESC']],
    });
  }
}

// ── OrderRepository ───────────────────────────────────────────────────────────
class OrderRepository extends BaseRepository {
  constructor() { super(Order, 'Order'); }

  findWithItems(id) {
    return Order.findByPk(id, {
      include: [{
        model: OrderItem, as: 'items',
        include: [{ model: MenuItem, as: 'menuItem', attributes: ['id', 'name', 'emoji'] }],
      }],
    });
  }

  findPaginated({ offset, limit, status, userId, search }) {
    const where = {};
    if (status) where.status  = status;
    if (userId) where.user_id = userId;
    if (search) {
      where[Op.or] = [
        { order_no:      { [Op.like]: `%${search}%` } },
        { customer_name: { [Op.like]: `%${search}%` } },
        { table_no:      { [Op.like]: `%${search}%` } },
      ];
    }
    return Order.findAndCountAll({
      where, limit, offset,
      include: [{ model: OrderItem, as: 'items' }],
      order:   [['placed_at', 'DESC']],
    });
  }

  generateOrderNo() {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `ORD-${ts}-${rand}`;
  }
}

// ── InvoiceRepository ─────────────────────────────────────────────────────────
class InvoiceRepository extends BaseRepository {
  constructor() { super(Invoice, 'Invoice'); }

  findWithOrder(id) {
    return Invoice.findByPk(id, {
      include: [{ model: Order, as: 'order', include: [{ model: OrderItem, as: 'items' }] }],
    });
  }

  findPaginated({ offset, limit, status, search }) {
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { invoice_no: { [Op.like]: `%${search}%` } },
      ];
    }
    return Invoice.findAndCountAll({
      where, limit, offset,
      include: [{ model: Order, as: 'order' }],
      order:   [['created_at', 'DESC']],
    });
  }

  generateInvoiceNo() {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 4).toUpperCase();
    return `INV-${ts}-${rand}`;
  }

  async getSalesReport({ startDate, endDate }) {
    const { sequelize } = require('../models');
    const { fn, col, literal } = require('sequelize');
    return Invoice.findAll({
      where: {
        status:   'paid',
        paid_at:  { [Op.between]: [startDate, endDate] },
      },
      attributes: [
        [fn('DATE', col('paid_at')), 'day'],
        [fn('COUNT', col('id')),     'total_invoices'],
        [fn('SUM',   col('total')),  'total_revenue'],
      ],
      group:  [literal('day')],
      order:  [[literal('day'), 'ASC']],
      raw:    true,
    });
  }
}

// ── StockItemRepository ───────────────────────────────────────────────────────
class StockItemRepository extends BaseRepository {
  constructor() { super(StockItem, 'StockItem'); }

  findLowStock() {
    const { sequelize } = require('../models');
    const { col, literal } = require('sequelize');
    return StockItem.findAll({
      where:  { [Op.and]: [literal('qty <= min_qty')] },
      order:  [['qty', 'ASC']],
    });
  }
}

// ── RefreshTokenRepository ────────────────────────────────────────────────────
class RefreshTokenRepository extends BaseRepository {
  constructor() { super(RefreshToken, 'RefreshToken'); }

  async findValid(tokenHash) {
    return RefreshToken.findOne({
      where: { token_hash: tokenHash, is_revoked: false, expires_at: { [Op.gt]: new Date() } },
    });
  }

  async revokeAllForUser(userId, t = null) {
    return RefreshToken.update(
      { is_revoked: true },
      { where: { user_id: userId, is_revoked: false }, transaction: t },
    );
  }

  async hashToken(raw) {
    return bcrypt.hash(raw, 10);
  }

  async verifyToken(raw, hash) {
    return bcrypt.compare(raw, hash);
  }

  async purgeExpired() {
    return RefreshToken.destroy({
      where: { expires_at: { [Op.lt]: new Date() } },
      force: true,
    });
  }
}

// ── NotificationRepository ────────────────────────────────────────────────────
class NotificationRepository extends BaseRepository {
  constructor() { super(Notification, 'Notification'); }

  findForUser(userId) {
    return Notification.findAll({
      where: { [Op.or]: [{ user_id: userId }, { user_id: null }] },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
  }
}

// Export singletons (Singleton pattern per repo)
module.exports = {
  menuItemRepo:    new MenuItemRepository(),
  orderRepo:       new OrderRepository(),
  invoiceRepo:     new InvoiceRepository(),
  stockItemRepo:   new StockItemRepository(),
  refreshTokenRepo:new RefreshTokenRepository(),
  notificationRepo:new NotificationRepository(),
};
