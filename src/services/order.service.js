'use strict';
const { sequelize }  = require('../config/database');
const orderRepo      = require('../repositories/order.repository');
const menuRepo       = require('../repositories/menu.repository');
const AppError       = require('../errors/AppError');
const { Order, OrderItem, AuditLog } = require('../models');

// Status transition machine
const NEXT_STATUS = {
  pending:   'preparing',
  preparing: 'ready',
  ready:     'served',
  served:    'paid',
};

const orderService = {
  async list(query) {
    return orderRepo.list(query);
  },

  async myOrders(userId, query) {
    return orderRepo.list({ ...query, userId });
  },

  async getById(id) {
    return orderRepo.findDetail(id);
  },

  async create(data, userId, io) {
    const { items, tableNumber, customerId, notes } = data;

    // Validate all menu items exist and have stock
    const menuItems = await Promise.all(
      items.map((i) => menuRepo.findById(i.menuItemId))
    );

    for (let i = 0; i < items.length; i++) {
      const mi = menuItems[i];
      if (!mi.isActive)        throw AppError.badRequest(`'${mi.name}' is not available`);
      if (mi.stock < items[i].qty)
        throw AppError.unprocessable(`Insufficient stock for '${mi.name}' (available: ${mi.stock})`);
    }

    const t = await sequelize.transaction();
    try {
      const orderNumber = await orderRepo.nextOrderNumber();
      const subtotal    = items.reduce((sum, it, idx) => sum + menuItems[idx].price * it.qty, 0);

      const order = await Order.create(
        { orderNumber, userId, customerId, tableNumber, notes, subtotal, total: subtotal, status: 'pending' },
        { transaction: t }
      );

      const orderItemsData = items.map((it, idx) => ({
        orderId:    order.id,
        menuItemId: it.menuItemId,
        name:       menuItems[idx].name,
        price:      menuItems[idx].price,
        qty:        it.qty,
        lineTotal:  menuItems[idx].price * it.qty,
      }));

      await OrderItem.bulkCreate(orderItemsData, { transaction: t });

      // Deduct stock
      for (let i = 0; i < items.length; i++) {
        await menuRepo.adjustStock(items[i].menuItemId, -items[i].qty);
      }

      await AuditLog.create({ userId, action: 'ORDER_CREATED', entity: 'Order', entityId: order.id }, { transaction: t });
      await t.commit();

      const full = await orderRepo.findDetail(order.id);

      // Real-time broadcast
      if (io) {
        io.emit('order:new', { orderId: order.id, orderNumber, tableNumber, status: 'pending' });
        io.emit('notification', { type: 'NEW_ORDER', message: `New order ${orderNumber} placed`, orderId: order.id });
      }

      return full;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async advance(id, userId, io) {
    const order = await orderRepo.findDetail(id);
    const next  = NEXT_STATUS[order.status];
    if (!next) throw AppError.badRequest(`Order cannot be advanced from status '${order.status}'`);

    order.status = next;
    await order.save();
    await AuditLog.create({ userId, action: 'ORDER_ADVANCED', entity: 'Order', entityId: id, meta: { from: order.previous('status'), to: next } });

    if (io) {
      io.emit('order:updated', { orderId: id, status: next });
      io.emit('notification', { type: 'ORDER_UPDATE', message: `Order #${order.orderNumber} is now ${next}`, orderId: id });
    }

    return order;
  },

  async cancel(id, userId, io) {
    const order = await orderRepo.findDetail(id);
    if (['paid', 'cancelled'].includes(order.status))
      throw AppError.badRequest(`Cannot cancel an order with status '${order.status}'`);

    const t = await sequelize.transaction();
    try {
      // Restore stock
      for (const item of order.items) {
        await menuRepo.adjustStock(item.menuItemId, +item.qty);
      }
      order.status = 'cancelled';
      await order.save({ transaction: t });
      await AuditLog.create({ userId, action: 'ORDER_CANCELLED', entity: 'Order', entityId: id }, { transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    if (io) io.emit('order:updated', { orderId: id, status: 'cancelled' });
    return order;
  },
};

module.exports = orderService;
