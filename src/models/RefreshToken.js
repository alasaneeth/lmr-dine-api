'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('RefreshToken', {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    userId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    tokenHash: {
      type:      DataTypes.STRING(255),
      allowNull: false,
      unique:    true,
    },
    family: {
      type:      DataTypes.STRING(36),
      allowNull: false,
      comment:   'Token family UUID for rotation-based revocation',
    },
    expiresAt: {
      type:      DataTypes.DATE,
      allowNull: false,
    },
    revokedAt: {
      type:      DataTypes.DATE,
      allowNull: true,
    },
    userAgent: DataTypes.STRING(500),
    ip:        DataTypes.STRING(45),
  }, {
    tableName:  'refresh_tokens',
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['token_hash'] },
      { fields: ['family'] },
    ],
  });
