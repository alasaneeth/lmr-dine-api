'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('MenuItem', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    category_id: { type: DataTypes.UUID, allowNull: false },
    name:        { type: DataTypes.STRING(120), allowNull: false },
    price:       { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    emoji:       { type: DataTypes.STRING(10), defaultValue: '🍽' },
    stock:       { type: DataTypes.INTEGER, defaultValue: 0 },
    is_available:{ type: DataTypes.BOOLEAN, defaultValue: true },
    image_url:   { type: DataTypes.STRING(500), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'menu_items',
    indexes: [
      { fields: ['category_id'] },
      { fields: ['is_available'] },
      { fields: ['name'] },
    ],
  });
