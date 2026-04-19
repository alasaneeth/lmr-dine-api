'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('AuditLog', {
    id: {
      type:          DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    userId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    action: {
      type:      DataTypes.STRING(100),
      allowNull: false,
    },
    entity: {
      type:      DataTypes.STRING(50),
      allowNull: true,
    },
    entityId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    meta: {
      type:      DataTypes.JSON,
      allowNull: true,
    },
    ip:        DataTypes.STRING(45),
    userAgent: DataTypes.STRING(500),
  }, {
    tableName:  'audit_logs',
    updatedAt:  false,
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['entity', 'entity_id'] },
      { fields: ['created_at'] },
    ],
  });
