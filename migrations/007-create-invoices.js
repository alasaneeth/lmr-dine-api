'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
      id:               { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      invoice_number:   { type: Sequelize.STRING(20), allowNull: false, unique: true },
      order_id:         { type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
                          references: { model: 'orders', key: 'id' }, onDelete: 'RESTRICT' },
      customer_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
                          references: { model: 'customers', key: 'id' }, onDelete: 'SET NULL' },
      subtotal:         { type: Sequelize.DECIMAL(10,2), allowNull: false },
      tax_amount:       { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },
      discount_amount:  { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },
      total:            { type: Sequelize.DECIMAL(10,2), allowNull: false },
      status:           { type: Sequelize.ENUM('pending','paid','voided'), defaultValue: 'pending' },
      paid_at:          { type: Sequelize.DATE, allowNull: true },
      payment_method:   { type: Sequelize.ENUM('cash','card','transfer','credit'), defaultValue: 'cash' },
      notes:            { type: Sequelize.TEXT, allowNull: true },
      created_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('invoices', ['status']);
    await queryInterface.addIndex('invoices', ['order_id']);
    await queryInterface.addIndex('invoices', ['customer_id']);
    await queryInterface.addIndex('invoices', ['created_at']);
    await queryInterface.addIndex('invoices', ['invoice_number']);
  },
  async down(queryInterface) { await queryInterface.dropTable('invoices'); },
};
