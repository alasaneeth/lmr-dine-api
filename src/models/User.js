'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    name: {
      type:      DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type:      DataTypes.STRING(191),
      allowNull: false,
      unique:    true,
      validate:  { isEmail: true },
    },
    passwordHash: {
      type:      DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type:         DataTypes.ENUM('admin', 'waiter', 'cashier', 'customer'),
      allowNull:    false,
      defaultValue: 'customer',
    },
    status: {
      type:         DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    mfaSecret: {
      type:      DataTypes.STRING(255),
      allowNull: true,
    },
    mfaEnabled: {
      type:         DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
    },
  }, {
    tableName:  'users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['status'] },
    ],
  });

  User.prototype.toSafeJSON = function () {
    const { passwordHash, mfaSecret, ...safe } = this.toJSON();
    return safe;
  };

  return User;
};
