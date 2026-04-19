'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_number: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      user_id:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
                      references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      customer_id:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
                      references: { model: 'customers', key: 'id' }, onDelete: 'SET NULL' },
      table_number: { type: Sequelize.STRING(20), allowNull: true, defaultValue: 'Takeaway' },
      status:       { type: Sequelize.ENUM('pending','preparing','ready','served','paid','cancelled'),
                      defaultValue: 'pending', allowNull: false },
      subtotal:     { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      total:        { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      notes:        { type: Sequelize.TEXT, allowNull: true },
      created_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['customer_id']);
    await queryInterface.addIndex('orders', ['order_number']);
    await queryInterface.addIndex('orders', ['created_at']);
  },
  async down(queryInterface) { await queryInterface.dropTable('orders'); },
};
