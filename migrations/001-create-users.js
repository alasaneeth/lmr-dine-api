'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name:         { type: Sequelize.STRING(100), allowNull: false },
      email:        { type: Sequelize.STRING(191), allowNull: false, unique: true },
      password_hash:{ type: Sequelize.STRING(255), allowNull: false },
      role:         { type: Sequelize.ENUM('admin','waiter','cashier','customer'), allowNull: false, defaultValue: 'customer' },
      status:       { type: Sequelize.ENUM('active','inactive'), defaultValue: 'active' },
      mfa_secret:   { type: Sequelize.STRING(255), allowNull: true },
      mfa_enabled:  { type: Sequelize.BOOLEAN, defaultValue: false },
      last_login_at:{ type: Sequelize.DATE, allowNull: true },
      created_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
