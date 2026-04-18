'use strict';
const { DataTypes } = require('sequelize');

/**
 * User model.
 * Roles: admin | waiter | cashier | customer
 */
module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type:          DataTypes.UUID,
      defaultValue:  DataTypes.UUIDV4,
      primaryKey:    true,
    },
    name: {
      type:          DataTypes.STRING(100),
      allowNull:     false,
      validate:      { len: [2, 100] },
    },
    email: {
      type:          DataTypes.STRING(150),
      allowNull:     false,
      unique:        true,
      validate:      { isEmail: true },
    },
    password_hash: {
      type:          DataTypes.STRING(255),
      allowNull:     false,
    },
    role: {
      type:          DataTypes.ENUM('admin', 'waiter', 'cashier', 'customer'),
      allowNull:     false,
      defaultValue:  'customer',
    },
    status: {
      type:          DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue:  'active',
    },
    initials: {
      type:          DataTypes.STRING(4),
      allowNull:     true,
    },
    mfa_secret: {
      type:          DataTypes.STRING(64),
      allowNull:     true,
    },
    mfa_enabled: {
      type:          DataTypes.BOOLEAN,
      defaultValue:  false,
    },
    last_login_at: {
      type:          DataTypes.DATE,
      allowNull:     true,
    },
    // Virtual – never stored
    password: {
      type:          DataTypes.VIRTUAL,
    },
  }, {
    tableName: 'users',
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['role'] },
      { fields: ['status'] },
    ],
    // Never return password_hash or mfa_secret to clients
    defaultScope: {
      attributes: { exclude: ['password_hash', 'mfa_secret'] },
    },
    scopes: {
      withPassword: { attributes: {} },
    },
  });

  return User;
};
