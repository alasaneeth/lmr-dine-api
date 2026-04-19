'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id:         { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
                    references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      action:     { type: Sequelize.STRING(100), allowNull: false },
      entity:     { type: Sequelize.STRING(50),  allowNull: true },
      entity_id:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      meta:       { type: Sequelize.JSON, allowNull: true },
      ip:         { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['entity', 'entity_id']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
  },
  async down(queryInterface) { await queryInterface.dropTable('audit_logs'); },
};
