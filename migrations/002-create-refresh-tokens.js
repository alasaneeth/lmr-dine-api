'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refresh_tokens', {
      id:         { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id:    { type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
                    references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token_hash: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      family:     { type: Sequelize.STRING(36),  allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      revoked_at: { type: Sequelize.DATE, allowNull: true },
      user_agent: { type: Sequelize.STRING(500), allowNull: true },
      ip:         { type: Sequelize.STRING(45),  allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('refresh_tokens', ['user_id']);
    await queryInterface.addIndex('refresh_tokens', ['token_hash']);
    await queryInterface.addIndex('refresh_tokens', ['family']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('refresh_tokens');
  },
};
