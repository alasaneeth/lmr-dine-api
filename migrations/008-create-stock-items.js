'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_items', {
      id:         { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name:       { type: Sequelize.STRING(150), allowNull: false },
      unit:       { type: Sequelize.STRING(20), defaultValue: 'units' },
      qty:        { type: Sequelize.DECIMAL(10,3), defaultValue: 0 },
      min_qty:    { type: Sequelize.DECIMAL(10,3), defaultValue: 0 },
      price:      { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },
      is_active:  { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('stock_items', ['is_active']);
  },
  async down(queryInterface) { await queryInterface.dropTable('stock_items'); },
};
