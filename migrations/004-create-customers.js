// ─── 004-create-customers.js ────────────────────────────────────────────────
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customers', {
      id:                  { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name:                { type: Sequelize.STRING(100), allowNull: false },
      email:               { type: Sequelize.STRING(191), allowNull: true, unique: true },
      phone:               { type: Sequelize.STRING(30),  allowNull: true },
      address:             { type: Sequelize.TEXT, allowNull: true },
      status:              { type: Sequelize.ENUM('active','inactive'), defaultValue: 'active' },
      credit_limit:        { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },
      outstanding_balance: { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },
      total_purchases:     { type: Sequelize.DECIMAL(12,2), defaultValue: 0 },
      notes:               { type: Sequelize.TEXT, allowNull: true },
      created_at:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('customers', ['email']);
    await queryInterface.addIndex('customers', ['status']);
  },
  async down(queryInterface) { await queryInterface.dropTable('customers'); },
};
