'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('menu_items', {
      id:          { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name:        { type: Sequelize.STRING(150), allowNull: false },
      category:    { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'Uncategorized' },
      price:       { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      stock:       { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      emoji:       { type: Sequelize.STRING(10), defaultValue: '🍽️' },
      image_url:   { type: Sequelize.STRING(500), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      is_active:   { type: Sequelize.BOOLEAN, defaultValue: true },
      section:     { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      created_at:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('menu_items', ['category']);
    await queryInterface.addIndex('menu_items', ['is_active']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('menu_items');
  },
};
