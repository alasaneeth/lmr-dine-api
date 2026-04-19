'use strict';
const { sequelize }  = require('../config/database');
const invoiceRepo    = require('../repositories/invoice.repository');
const orderRepo      = require('../repositories/order.repository');
const AppError       = require('../errors/AppError');
const { Invoice, Customer, AuditLog } = require('../models');

const invoiceService = {
  async list(query) {
    return invoiceRepo.list(query);
  },

  async getById(id) {
    const inv = await invoiceRepo.findDetail(id);
    if (!inv) throw AppError.notFound(`Invoice #${id} not found`);
    return inv;
  },

  async create(data, userId) {
    const { orderId, customerId, taxAmount = 0, discountAmount = 0, paymentMethod = 'cash', notes } = data;

    const order = await orderRepo.findDetail(orderId);
    if (!order)  throw AppError.notFound('Order not found');
    if (order.status === 'cancelled') throw AppError.badRequest('Cannot invoice a cancelled order');

    const existing = await Invoice.findOne({ where: { orderId } });
    if (existing)  throw AppError.conflict('Invoice already exists for this order');

    const subtotal = parseFloat(order.total);
    const total    = subtotal + parseFloat(taxAmount) - parseFloat(discountAmount);

    const t = await sequelize.transaction();
    try {
      const invoiceNumber = await invoiceRepo.nextInvoiceNumber();
      const invoice = await Invoice.create({
        invoiceNumber, orderId, customerId, subtotal, taxAmount, discountAmount, total, paymentMethod, notes,
      }, { transaction: t });

      // Update customer totals if linked
      if (customerId) {
        const customer = await Customer.findByPk(customerId);
        if (customer) {
          if (paymentMethod === 'credit') {
            customer.outstandingBalance = parseFloat(customer.outstandingBalance) + total;
          }
          customer.totalPurchases = parseFloat(customer.totalPurchases) + total;
          await customer.save({ transaction: t });
        }
      }

      await AuditLog.create({ userId, action: 'INVOICE_CREATED', entity: 'Invoice', entityId: invoice.id }, { transaction: t });
      await t.commit();
      return invoiceRepo.findDetail(invoice.id);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async markPaid(id, userId) {
    const invoice = await invoiceRepo.findDetail(id);
    if (!invoice) throw AppError.notFound('Invoice not found');
    if (invoice.status === 'paid') throw AppError.conflict('Invoice already paid');

    const t = await sequelize.transaction();
    try {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      await invoice.save({ transaction: t });

      // If credit payment, reduce outstanding balance
      if (invoice.paymentMethod === 'credit' && invoice.customerId) {
        const customer = await Customer.findByPk(invoice.customerId);
        if (customer) {
          customer.outstandingBalance = Math.max(0, parseFloat(customer.outstandingBalance) - parseFloat(invoice.total));
          await customer.save({ transaction: t });
        }
      }

      // Mark the linked order as paid
      if (invoice.Order) {
        invoice.Order.status = 'paid';
        await invoice.Order.save({ transaction: t });
      }

      await AuditLog.create({ userId, action: 'INVOICE_PAID', entity: 'Invoice', entityId: id }, { transaction: t });
      await t.commit();
      return invoice;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async salesReport(query) {
    return invoiceRepo.salesReport(query);
  },
};

module.exports = invoiceService;
