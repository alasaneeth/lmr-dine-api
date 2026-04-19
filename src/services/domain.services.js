'use strict';
const stockRepo    = require('../repositories/stock.repository');
const userRepo     = require('../repositories/user.repository');
const dashRepo     = require('../repositories/dashboard.repository');
const customerRepo = require('../repositories/customer.repository');
const AppError     = require('../errors/AppError');
const { hash }     = require('../utils/password');
const { AuditLog } = require('../models');

// ── Stock Service ─────────────────────────────────────────────────────────────
const stockService = {
  list:     (q)       => stockRepo.list(q),
  getLow:   ()        => stockRepo.getLowStock(),
  getById:  (id)      => stockRepo.findById(id),
  create:   (data)    => stockRepo.create(data),
  update:   (id, d)   => stockRepo.update(id, d),
  adjust:   (id, delta) => stockRepo.adjust(id, delta),
  async remove(id) {
    const item = await stockRepo.findById(id);
    item.isActive = false;
    return item.save();
  },
};

// ── User Service ──────────────────────────────────────────────────────────────
const userService = {
  list:    (q)      => userRepo.list(q),
  getById: (id)     => userRepo.findById(id, { attributes: { exclude: ['passwordHash','mfaSecret'] } }),

  async update(id, data, actorId) {
    const user    = await userRepo.findById(id);
    const payload = { ...data };
    if (data.password) {
      payload.passwordHash = await hash(data.password);
      delete payload.password;
    }
    const updated = await user.update(payload);
    await AuditLog.create({ userId: actorId, action: 'USER_UPDATED', entity: 'User', entityId: id });
    return updated.toSafeJSON();
  },

  async setStatus(id, status, actorId) {
    const user = await userRepo.findById(id);
    user.status = status;
    await user.save();
    await AuditLog.create({ userId: actorId, action: 'USER_STATUS_CHANGED', entity: 'User', entityId: id, meta: { status } });
    return user.toSafeJSON();
  },

  async remove(id, actorId) {
    if (id === actorId) throw AppError.badRequest('Cannot delete your own account');
    const user = await userRepo.findById(id);
    user.status = 'inactive';
    await user.save();
    await AuditLog.create({ userId: actorId, action: 'USER_DELETED', entity: 'User', entityId: id });
    return true;
  },
};

// ── Dashboard Service ─────────────────────────────────────────────────────────
const dashboardService = {
  adminStats:  () => dashRepo.adminStats(),
  weeklySales: () => dashRepo.weeklySales(),
};

// ── Customer Service ──────────────────────────────────────────────────────────
const customerService = {
  list:    (q)      => customerRepo.list(q),
  getById: (id)     => customerRepo.findById(id),
  create:  (data)   => customerRepo.create(data),
  update:  (id, d)  => customerRepo.update(id, d),
  async remove(id) {
    const c = await customerRepo.findById(id);
    c.status = 'inactive';
    return c.save();
  },
  async setStatus(id, status) {
    const c = await customerRepo.findById(id);
    c.status = status;
    return c.save();
  },
  // Reports
  salesReport:   (q)        => customerRepo.salesReport(q),
  creditReport:  (q)        => customerRepo.creditReport(q),
  reportSummary: (q)        => customerRepo.reportSummary(q),
  getById:       (id)       => customerRepo.findById(id),
};

module.exports = { stockService, userService, dashboardService, customerService };
