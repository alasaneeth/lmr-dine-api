'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('MenuItem', {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    name: {
      type:      DataTypes.STRING(150),
      allowNull: false,
    },
    category: {
      type:         DataTypes.STRING(100),
      allowNull:    false,
      defaultValue: 'Uncategorized',
    },
    price: {
      type:      DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stock: {
      type:         DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    emoji: {
      type:         DataTypes.STRING(10),
      defaultValue: '🍽️',
    },
    imageUrl: {
      type:      DataTypes.STRING(500),
      allowNull: true,
    },
    description: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type:         DataTypes.BOOLEAN,
      defaultValue: true,
    },
    section: {
      type:         DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
  }, {
    tableName:  'menu_items',
    timestamps: true,
    indexes: [
      { fields: ['category'] },
      { fields: ['is_active'] },
    ],
  });
