'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── users ──────────────────────────────────────────────────────────────
    await queryInterface.createTable('users', {
      id:            { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name:          { type: Sequelize.STRING(100), allowNull: false },
      email:         { type: Sequelize.STRING(150), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role:          { type: Sequelize.ENUM('admin','waiter','cashier','customer'), defaultValue: 'customer' },
      status:        { type: Sequelize.ENUM('active','inactive','suspended'), defaultValue: 'active' },
      initials:      { type: Sequelize.STRING(4) },
      mfa_secret:    { type: Sequelize.STRING(64) },
      mfa_enabled:   { type: Sequelize.BOOLEAN, defaultValue: false },
      last_login_at: { type: Sequelize.DATE },
      created_at:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      deleted_at:    { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['role']);

    // ── categories ────────────────────────────────────────────────────────
    await queryInterface.createTable('categories', {
      id:         { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name:       { type: Sequelize.STRING(80), allowNull: false, unique: true },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE },
    });

    // ── menu_items ────────────────────────────────────────────────────────
    await queryInterface.createTable('menu_items', {
      id:           { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      category_id:  { type: Sequelize.UUID, allowNull: false, references: { model: 'categories', key: 'id' }, onDelete: 'RESTRICT' },
      name:         { type: Sequelize.STRING(120), allowNull: false },
      price:        { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      emoji:        { type: Sequelize.STRING(10), defaultValue: '🍽' },
      stock:        { type: Sequelize.INTEGER, defaultValue: 0 },
      is_available: { type: Sequelize.BOOLEAN, defaultValue: true },
      image_url:    { type: Sequelize.STRING(500) },
      description:  { type: Sequelize.TEXT },
      created_at:   { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at:   { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      deleted_at:   { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('menu_items', ['category_id']);
    await queryInterface.addIndex('menu_items', ['is_available']);

    // ── orders ────────────────────────────────────────────────────────────
    await queryInterface.createTable('orders', {
      id:            { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      order_no:      { type: Sequelize.STRING(20), allowNull: false, unique: true },
      user_id:       { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      table_no:      { type: Sequelize.STRING(20), allowNull: false },
      customer_name: { type: Sequelize.STRING(100) },
      status:        { type: Sequelize.ENUM('pending','preparing','ready','served','paid','cancelled'), defaultValue: 'pending' },
      total:         { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      notes:         { type: Sequelize.TEXT },
      placed_at:     { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      created_at:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      deleted_at:    { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['placed_at']);

    // ── order_items ───────────────────────────────────────────────────────
    await queryInterface.createTable('order_items', {
      id:           { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      order_id:     { type: Sequelize.UUID, allowNull: false, references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE' },
      menu_item_id: { type: Sequelize.UUID, references: { model: 'menu_items', key: 'id' }, onDelete: 'SET NULL' },
      name:         { type: Sequelize.STRING(120), allowNull: false },
      price:        { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      qty:          { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      subtotal:     { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at:   { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at:   { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      deleted_at:   { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('order_items', ['order_id']);

    // ── invoices ──────────────────────────────────────────────────────────
    await queryInterface.createTable('invoices', {
      id:             { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      invoice_no:     { type: Sequelize.STRING(20), allowNull: false, unique: true },
      order_id:       { type: Sequelize.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
      cashier_id:     { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      subtotal:       { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      tax:            { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      discount:       { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      total:          { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      status:         { type: Sequelize.ENUM('pending','paid','void'), defaultValue: 'pending' },
      payment_method: { type: Sequelize.ENUM('cash','card','online') },
      paid_at:        { type: Sequelize.DATE },
      created_at:     { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at:     { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      deleted_at:     { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('invoices', ['order_id']);
    await queryInterface.addIndex('invoices', ['status']);
    await queryInterface.addIndex('invoices', ['paid_at']);

    // ── stock_items ───────────────────────────────────────────────────────
    await queryInterface.createTable('stock_items', {
      id:         { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name:       { type: Sequelize.STRING(100), allowNull: false, unique: true },
      unit:       { type: Sequelize.STRING(20), allowNull: false },
      qty:        { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      min_qty:    { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      price:      { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE },
    });

    // ── refresh_tokens ────────────────────────────────────────────────────
    await queryInterface.createTable('refresh_tokens', {
      id:          { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id:     { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token_hash:  { type: Sequelize.STRING(255), allowNull: false },
      expires_at:  { type: Sequelize.DATE, allowNull: false },
      is_revoked:  { type: Sequelize.BOOLEAN, defaultValue: false },
      replaced_by: { type: Sequelize.STRING(255) },
      user_agent:  { type: Sequelize.STRING(500) },
      ip_address:  { type: Sequelize.STRING(45) },
      created_at:  { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at:  { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      deleted_at:  { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('refresh_tokens', ['user_id']);
    await queryInterface.addIndex('refresh_tokens', ['expires_at']);

    // ── notifications ─────────────────────────────────────────────────────
    await queryInterface.createTable('notifications', {
      id:         { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id:    { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type:       { type: Sequelize.STRING(50), allowNull: false },
      title:      { type: Sequelize.STRING(200), allowNull: false },
      message:    { type: Sequelize.TEXT, allowNull: false },
      data:       { type: Sequelize.JSON },
      is_read:    { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('notifications', ['user_id']);
  },

  async down(queryInterface) {
    for (const table of [
      'notifications', 'refresh_tokens', 'stock_items',
      'invoices', 'order_items', 'orders', 'menu_items', 'categories', 'users',
    ]) {
      await queryInterface.dropTable(table, { cascade: true });
    }
  },
};
