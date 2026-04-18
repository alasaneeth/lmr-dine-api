'use strict';
const authService                          = require('../services/auth.service');
const orderService                         = require('../services/order.service');
const { menuService, stockService, invoiceService, userService, dashboardService } = require('../services/services');
const R = require('../utils/response');

// ══════════════════════════════════════════════════════════════════════════════
//  AuthController
// ══════════════════════════════════════════════════════════════════════════════
const AuthController = {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      R.created(res, { user });
    } catch (e) { next(e); }
  },

  async login(req, res, next) {
    try {
      const meta   = { userAgent: req.get('User-Agent'), ip: req.ip };
      const result = await authService.login(req.body, meta);
      if (result.requiresMfa) return R.success(res, { requiresMfa: true }, 200);
      const { accessToken, refreshToken, user } = result;
      // Refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:   7 * 24 * 60 * 60 * 1000,
      });
      R.success(res, { user, accessToken });
    } catch (e) { next(e); }
  },

  async refresh(req, res, next) {
    try {
      const rawRefresh = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!rawRefresh) {
        const { AuthenticationError } = require('../utils/errors');
        return next(new AuthenticationError('Refresh token not provided'));
      }
      const meta   = { userAgent: req.get('User-Agent'), ip: req.ip };
      const result = await authService.refresh(rawRefresh, meta);
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:   7 * 24 * 60 * 60 * 1000,
      });
      R.success(res, { user: result.user, accessToken: result.accessToken });
    } catch (e) { next(e); }
  },

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.sub);
      res.clearCookie('refreshToken');
      R.success(res, { message: 'Logged out' });
    } catch (e) { next(e); }
  },

  async setupMfa(req, res, next) {
    try {
      const data = await authService.setupMfa(req.user.sub);
      R.success(res, data);
    } catch (e) { next(e); }
  },

  async enableMfa(req, res, next) {
    try {
      const data = await authService.enableMfa(req.user.sub, req.body.token);
      R.success(res, data);
    } catch (e) { next(e); }
  },

  async disableMfa(req, res, next) {
    try {
      const data = await authService.disableMfa(req.user.sub);
      R.success(res, data);
    } catch (e) { next(e); }
  },

  async me(req, res) {
    R.success(res, { user: req.user });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
//  MenuController
// ══════════════════════════════════════════════════════════════════════════════
const MenuController = {
  async getAll(req, res, next) {
    try { R.success(res, await menuService.getMenu(req.query)); } catch (e) { next(e); }
  },
  async getOne(req, res, next) {
    try { R.success(res, await menuService.getMenuItemById(req.params.id)); } catch (e) { next(e); }
  },
  async create(req, res, next) {
    try { R.created(res, await menuService.createMenuItem(req.body, req.file)); } catch (e) { next(e); }
  },
  async update(req, res, next) {
    try { R.success(res, await menuService.updateMenuItem(req.params.id, req.body, req.file)); } catch (e) { next(e); }
  },
  async remove(req, res, next) {
    try { await menuService.deleteMenuItem(req.params.id); R.noContent(res); } catch (e) { next(e); }
  },
  async adjustStock(req, res, next) {
    try { R.success(res, await menuService.updateStock(req.params.id, req.body.qty)); } catch (e) { next(e); }
  },
};

// ══════════════════════════════════════════════════════════════════════════════
//  OrderController
// ══════════════════════════════════════════════════════════════════════════════
const OrderController = {
  async getAll(req, res, next) {
    try { R.success(res, await orderService.getOrders(req.query)); } catch (e) { next(e); }
  },
  async getOne(req, res, next) {
    try { R.success(res, await orderService.getOrderById(req.params.id)); } catch (e) { next(e); }
  },
  async create(req, res, next) {
    try {
      const io    = req.app.get('io');
      const order = await orderService.createOrder(
        { ...req.body, userId: req.user?.sub },
        io
      );
      R.created(res, order);
    } catch (e) { next(e); }
  },
  async advance(req, res, next) {
    try {
      const io    = req.app.get('io');
      const order = await orderService.advanceStatus(req.params.id, io);
      R.success(res, order);
    } catch (e) { next(e); }
  },
  async cancel(req, res, next) {
    try {
      const io    = req.app.get('io');
      const order = await orderService.cancelOrder(req.params.id, io);
      R.success(res, order);
    } catch (e) { next(e); }
  },
};

// ══════════════════════════════════════════════════════════════════════════════
//  InvoiceController
// ══════════════════════════════════════════════════════════════════════════════
const InvoiceController = {
  async getAll(req, res, next) {
    try { R.success(res, await invoiceService.getInvoices(req.query)); } catch (e) { next(e); }
  },
  async getOne(req, res, next) {
    try { R.success(res, await invoiceService.getInvoiceById(req.params.id)); } catch (e) { next(e); }
  },
  async create(req, res, next) {
    try {
      const inv = await invoiceService.createInvoice({ ...req.body, cashierId: req.user.sub });
      R.created(res, inv);
    } catch (e) { next(e); }
  },
  async markPaid(req, res, next) {
    try { R.success(res, await invoiceService.markPaid(req.params.id, req.user.sub)); } catch (e) { next(e); }
  },
  async salesReport(req, res, next) {
    try { R.success(res, await invoiceService.getSalesReport(req.query)); } catch (e) { next(e); }
  },
};

// ══════════════════════════════════════════════════════════════════════════════
//  StockController
// ══════════════════════════════════════════════════════════════════════════════
const StockController = {
  async getAll(req, res, next) {
    try { R.success(res, await stockService.getStockItems(req.query)); } catch (e) { next(e); }
  },
  async getLowStock(req, res, next) {
    try { R.success(res, await stockService.getLowStockItems()); } catch (e) { next(e); }
  },
  async create(req, res, next) {
    try { R.created(res, await stockService.createStockItem(req.body)); } catch (e) { next(e); }
  },
  async update(req, res, next) {
    try { R.success(res, await stockService.updateStockItem(req.params.id, req.body)); } catch (e) { next(e); }
  },
  async adjust(req, res, next) {
    try { R.success(res, await stockService.adjustStock(req.params.id, req.body.delta)); } catch (e) { next(e); }
  },
  async remove(req, res, next) {
    try { await stockService.deleteStockItem(req.params.id); R.noContent(res); } catch (e) { next(e); }
  },
};

// ══════════════════════════════════════════════════════════════════════════════
//  UserController
// ══════════════════════════════════════════════════════════════════════════════
const UserController = {
  async getAll(req, res, next) {
    try { R.success(res, await userService.getUsers(req.query)); } catch (e) { next(e); }
  },
  async getOne(req, res, next) {
    try { R.success(res, await userService.getUserById(req.params.id)); } catch (e) { next(e); }
  },
  async update(req, res, next) {
    try { R.success(res, await userService.updateUser(req.params.id, req.body)); } catch (e) { next(e); }
  },
  async setStatus(req, res, next) {
    try { R.success(res, await userService.setUserStatus(req.params.id, req.body.status)); } catch (e) { next(e); }
  },
  async remove(req, res, next) {
    try { await userService.deleteUser(req.params.id); R.noContent(res); } catch (e) { next(e); }
  },
};

// ══════════════════════════════════════════════════════════════════════════════
//  DashboardController
// ══════════════════════════════════════════════════════════════════════════════
const DashboardController = {
  async adminStats(req, res, next) {
    try { R.success(res, await dashboardService.getAdminStats()); } catch (e) { next(e); }
  },
  async weeklySales(req, res, next) {
    try { R.success(res, await dashboardService.getWeeklySales()); } catch (e) { next(e); }
  },
};

module.exports = {
  AuthController,
  MenuController,
  OrderController,
  InvoiceController,
  StockController,
  UserController,
  DashboardController,
};
