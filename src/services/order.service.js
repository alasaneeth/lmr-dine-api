'use strict';
const { orderRepo, menuItemRepo, notificationRepo } = require('../repositories/repositories');
const { sequelize }      = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePagination } = require('../utils/pagination');
const { logger }         = require('../utils/logger');

const STATUS_FLOW = ['pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'];
const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'served', served: 'paid' };

class OrderService {

  async getOrders(query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, count } = await orderRepo.findPaginated({
      offset, limit,
      status: query.status,
      userId: query.userId,
      search: query.search,
    });
    return { orders: rows, total: count, page, limit };
  }

  async getOrderById(id) {
    return orderRepo.findWithItems(id);
  }

  async createOrder({ userId, tableNo, customerName, notes, items }, io = null) {
    if (!items || items.length === 0) throw new BadRequestError('Order must contain at least one item');

    return sequelize.transaction(async (t) => {
      // Validate & reserve stock
      let total = 0;
      const resolvedItems = [];

      for (const line of items) {
        const menuItem = await menuItemRepo.findById(line.menuItemId);
        if (!menuItem.is_available) throw new BadRequestError(`${menuItem.name} is not available`);
        if (menuItem.stock < line.qty) throw new BadRequestError(`Insufficient stock for ${menuItem.name}`);

        // Decrement stock
        await menuItemRepo.updateById(menuItem.id, { stock: menuItem.stock - line.qty }, { transaction: t });

        const subtotal = parseFloat(menuItem.price) * line.qty;
        total += subtotal;
        resolvedItems.push({ menuItem, qty: line.qty, subtotal });
      }

      const order_no = orderRepo.generateOrderNo();
      const order = await orderRepo.create({
        order_no,
        user_id:       userId,
        table_no:      tableNo,
        customer_name: customerName,
        notes,
        total:         total.toFixed(2),
        status:        'pending',
      }, { transaction: t });

      // Bulk-create order items (price snapshot)
      await order.createItems = undefined;
      const { OrderItem } = require('../models');
      await OrderItem.bulkCreate(
        resolvedItems.map(({ menuItem, qty, subtotal }) => ({
          order_id:     order.id,
          menu_item_id: menuItem.id,
          name:         menuItem.name,
          price:        menuItem.price,
          qty,
          subtotal,
        })),
        { transaction: t }
      );

      logger.info({ event: 'order.created', orderId: order.id, total });

      // Real-time notification to kitchen staff
      if (io) {
        io.to('kitchen').emit('order:new', {
          orderId:  order.id,
          orderNo:  order_no,
          tableNo,
          total,
        });
        await notificationRepo.create({
          user_id: null, // broadcast
          type:    'ORDER_NEW',
          title:   'New Order',
          message: `Order ${order_no} placed for ${tableNo}`,
          data:    { orderId: order.id },
        }, { transaction: t });
      }

      return orderRepo.findWithItems(order.id);
    });
  }

  async advanceStatus(id, io = null) {
    const order = await orderRepo.findById(id);
    const next  = NEXT_STATUS[order.status];
    if (!next) throw new BadRequestError(`Order cannot be advanced from status: ${order.status}`);

    await order.update({ status: next });

    if (io) {
      io.to('kitchen').to('waiters').emit('order:status', {
        orderId: order.id, orderNo: order.order_no, status: next,
      });
    }
    logger.info({ event: 'order.advanced', orderId: id, from: order.status, to: next });
    return order;
  }

  async cancelOrder(id, io = null) {
    const order = await orderRepo.findById(id);
    if (['paid', 'cancelled'].includes(order.status)) {
      throw new BadRequestError('Order cannot be cancelled in its current state');
    }
    await order.update({ status: 'cancelled' });

    if (io) {
      io.to('kitchen').emit('order:cancelled', { orderId: order.id, orderNo: order.order_no });
    }
    return order;
  }
}

module.exports = new OrderService();
