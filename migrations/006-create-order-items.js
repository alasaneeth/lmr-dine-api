'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_id:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
                      references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE' },
      menu_item_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
                      references: { model: 'menu_items', key: 'id' }, onDelete: 'RESTRICT' },
      name:         { type: Sequelize.STRING(150), allowNull: false },
      price:        { type: Sequelize.DECIMAL(10,2), allowNull: false },
      qty:          { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      line_total:   { type: Sequelize.DECIMAL(10,2), allowNull: false },
    });
    await queryInterface.addIndex('order_items', ['order_id']);
    await queryInterface.addIndex('order_items', ['menu_item_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('order_items'); },
};
