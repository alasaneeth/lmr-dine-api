'use strict';
const { fn, col, literal, Op } = require('sequelize');
const { Order, Invoice, User, MenuItem } = require('../models');

class DashboardRepository {
  async adminStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      todayRevenue,
      totalUsers,
      lowStockCount,
    ] = await Promise.all([
      Order.count(),
      Order.count({ where: { status: { [Op.in]: ['pending', 'preparing', 'ready'] } } }),
      Invoice.findOne({
        where:      { status: 'paid', paidAt: { [Op.gte]: today } },
        attributes: [[fn('SUM', col('total')), 'total']],
        raw:        true,
      }),
      User.count({ where: { status: 'active' } }),
      MenuItem.count({ where: { stock: { [Op.lte]: 5 }, isActive: true } }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      todayRevenue:  parseFloat(todayRevenue?.total || 0),
      totalUsers,
      lowStockCount,
    };
  }

  async weeklySales() {
    const rows = await Invoice.findAll({
      where: {
        status: 'paid',
        paidAt: { [Op.gte]: literal('DATE_SUB(CURDATE(), INTERVAL 6 DAY)') },
      },
      attributes: [
        [fn('DATE', col('paid_at')),  'day'],
        [fn('SUM',  col('total')),    'revenue'],
        [fn('COUNT', col('id')),      'orders'],
      ],
      group: [literal('DATE(paid_at)')],
      order: [[literal('DATE(paid_at)'), 'ASC']],
      raw:   true,
    });
    return rows;
  }
}

module.exports = new DashboardRepository();
