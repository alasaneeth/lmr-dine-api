'use strict';
const path  = require('path');
const sharp = require('sharp');
const { menuItemRepo, invoiceRepo, stockItemRepo } = require('../repositories/repositories');
const userRepo    = require('../repositories/user.repository');
const { sequelize } = require('../models');
const { parsePagination } = require('../utils/pagination');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { logger } = require('../utils/logger');

// ══════════════════════════════════════════════════════════════════════════════
//  MenuService
// ══════════════════════════════════════════════════════════════════════════════
class MenuService {
  async getMenu(query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, count } = await menuItemRepo.findPaginated({
      offset, limit,
      search:     query.search,
      categoryId: query.categoryId,
      isAvailable: query.isAvailable !== undefined
        ? query.isAvailable === 'true'
        : undefined,
    });
    return { items: rows, total: count, page, limit };
  }

  async getMenuItemById(id) {
    return menuItemRepo.findById(id);
  }

  async createMenuItem(data, file = null) {
    if (file) data.image_url = await this._processImage(file);
    const item = await menuItemRepo.create(data);
    logger.info({ event: 'menu.created', itemId: item.id });
    return item;
  }

  async updateMenuItem(id, data, file = null) {
    if (file) data.image_url = await this._processImage(file);
    return menuItemRepo.updateById(id, data);
  }

  async deleteMenuItem(id) {
    return menuItemRepo.deleteById(id);
  }

  async updateStock(id, qty) {
    const item = await menuItemRepo.findById(id);
    const newStock = item.stock + qty;
    if (newStock < 0) throw new BadRequestError('Stock cannot be negative');
    return menuItemRepo.updateById(id, { stock: newStock });
  }

  async _processImage(file) {
    const filename = `menu_${Date.now()}.webp`;
    const dest     = path.join(process.env.UPLOAD_DIR || 'uploads', filename);
    await sharp(file.path).resize(400, 400, { fit: 'cover' }).webp({ quality: 80 }).toFile(dest);
    return `/uploads/${filename}`;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  StockService
// ══════════════════════════════════════════════════════════════════════════════
class StockService {
  async getStockItems(query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, count } = await stockItemRepo.findAndCountAll({
      limit, offset, order: [['name', 'ASC']],
    });
    return { items: rows, total: count, page, limit };
  }

  async getLowStockItems() {
    return stockItemRepo.findLowStock();
  }

  async createStockItem(data) {
    return stockItemRepo.create(data);
  }

  async updateStockItem(id, data) {
    return stockItemRepo.updateById(id, data);
  }

  async adjustStock(id, delta) {
    const item    = await stockItemRepo.findById(id);
    const newQty  = parseFloat(item.qty) + parseFloat(delta);
    if (newQty < 0) throw new BadRequestError('Stock cannot go below zero');
    return stockItemRepo.updateById(id, { qty: newQty });
  }

  async deleteStockItem(id) {
    return stockItemRepo.deleteById(id);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  InvoiceService
// ══════════════════════════════════════════════════════════════════════════════
class InvoiceService {
  async getInvoices(query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, count } = await invoiceRepo.findPaginated({
      offset, limit,
      status: query.status,
      search: query.search,
    });
    return { invoices: rows, total: count, page, limit };
  }

  async getInvoiceById(id) {
    return invoiceRepo.findWithOrder(id);
  }

  async createInvoice({ orderId, cashierId, paymentMethod }) {
    const { Order, OrderItem } = require('../models');
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items' }],
    });
    if (!order) throw new NotFoundError('Order');

    const subtotal = order.items.reduce((s, i) => s + parseFloat(i.subtotal), 0);
    const tax      = 0; // extend for GST/VAT as needed
    const total    = subtotal + tax;

    return sequelize.transaction(async (t) => {
      const invoice = await invoiceRepo.create({
        invoice_no:     invoiceRepo.generateInvoiceNo(),
        order_id:       orderId,
        cashier_id:     cashierId,
        subtotal,
        tax,
        discount:       0,
        total,
        status:         'pending',
        payment_method: paymentMethod,
      }, { transaction: t });

      return invoice;
    });
  }

  async markPaid(id, cashierId) {
    const invoice = await invoiceRepo.findById(id);
    if (invoice.status === 'paid') throw new BadRequestError('Invoice already paid');

    await sequelize.transaction(async (t) => {
      await invoice.update({ status: 'paid', paid_at: new Date(), cashier_id: cashierId }, { transaction: t });
      // Also mark the order as paid
      const { Order } = require('../models');
      await Order.update({ status: 'paid' }, { where: { id: invoice.order_id }, transaction: t });
    });

    return invoice.reload();
  }

  async getSalesReport(query) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 7 * 86400000);
    const endDate   = query.endDate   ? new Date(query.endDate)   : new Date();
    return invoiceRepo.getSalesReport({ startDate, endDate });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  UserService
// ══════════════════════════════════════════════════════════════════════════════
class UserService {
  async getUsers(query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, count } = await userRepo.findPaginated({
      offset, limit,
      search: query.search,
      role:   query.role,
      status: query.status,
    });
    return { users: rows, total: count, page, limit };
  }

  async getUserById(id) {
    return userRepo.findById(id);
  }

  async updateUser(id, data) {
    // Prevent role escalation without proper permission (caller must validate)
    return userRepo.updateById(id, data);
  }

  async setUserStatus(id, status) {
    return userRepo.updateById(id, { status });
  }

  async deleteUser(id) {
    return userRepo.deleteById(id);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  DashboardService
// ══════════════════════════════════════════════════════════════════════════════
class DashboardService {
  async getAdminStats() {
    const { Order, Invoice, User, MenuItem, OrderItem } = require('../models');
    const { fn, col, literal, Op } = require('sequelize');

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [totalOrders, pendingOrders, todayRevenue, totalUsers, recentOrders, topItems] =
      await Promise.all([
        Order.count(),
        Order.count({ where: { status: 'pending' } }),
        Invoice.sum('total', { where: { status: 'paid', paid_at: { [Op.between]: [todayStart, todayEnd] } } }),
        User.count(),
        Order.findAll({
          limit: 10,
          order: [['placed_at', 'DESC']],
          include: [{ model: OrderItem, as: 'items' }],
        }),
        OrderItem.findAll({
          attributes: [
            'name',
            [fn('SUM', col('qty')), 'total_sold'],
            [fn('SUM', col('subtotal')), 'total_revenue'],
          ],
          group: ['name'],
          order: [[literal('total_sold'), 'DESC']],
          limit: 5,
          raw: true,
        }),
      ]);

    return {
      totalOrders,
      pendingOrders,
      todayRevenue:  todayRevenue || 0,
      totalUsers,
      recentOrders,
      topItems,
    };
  }

  async getWeeklySales() {
    const { Invoice } = require('../models');
    const { fn, col, literal } = require('sequelize');
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    return Invoice.findAll({
      where: { status: 'paid', paid_at: { [require('sequelize').Op.gte]: sevenDaysAgo } },
      attributes: [
        [fn('DATE', col('paid_at')), 'day'],
        [fn('COUNT', col('id')), 'orders'],
        [fn('SUM', col('total')), 'revenue'],
      ],
      group: [literal('day')],
      order: [[literal('day'), 'ASC']],
      raw: true,
    });
  }
}

module.exports = {
  menuService:     new MenuService(),
  stockService:    new StockService(),
  invoiceService:  new InvoiceService(),
  userService:     new UserService(),
  dashboardService:new DashboardService(),
};
