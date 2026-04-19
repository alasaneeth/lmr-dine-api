'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const hash = (p) => bcrypt.hashSync(p, 12);
    const now  = new Date();

    // ── Users (matches frontend demoCredentials) ──────────────────────────
    await queryInterface.bulkInsert('users', [
      { name: 'Kavindu Dilshan', email: 'admin@resto.lk',    password_hash: hash('admin123'),    role: 'admin',    status: 'active', mfa_enabled: false, created_at: now, updated_at: now },
      { name: 'Nimal Perera',    email: 'waiter@resto.lk',   password_hash: hash('waiter123'),   role: 'waiter',   status: 'active', mfa_enabled: false, created_at: now, updated_at: now },
      { name: 'Samitha Bandara', email: 'cashier@resto.lk',  password_hash: hash('cashier123'),  role: 'cashier',  status: 'active', mfa_enabled: false, created_at: now, updated_at: now },
      { name: 'Dilini Fernando', email: 'customer@resto.lk', password_hash: hash('customer123'), role: 'customer', status: 'active', mfa_enabled: false, created_at: now, updated_at: now },
      { name: 'Ruwan Mendis',    email: 'ruwan@resto.lk',    password_hash: hash('waiter123'),   role: 'waiter',   status: 'inactive', mfa_enabled: false, created_at: now, updated_at: now },
      { name: 'Amal Perera',     email: 'amal@resto.lk',     password_hash: hash('customer123'), role: 'customer', status: 'active', mfa_enabled: false, created_at: now, updated_at: now },
    ]);

    // ── Menu Items (matches frontend mockData) ────────────────────────────
    await queryInterface.bulkInsert('menu_items', [
      { name: 'White String Hopper', category: 'Main Dishes',  price: 5,  stock: 40, emoji: '⬜', section: 0, is_active: true, created_at: now, updated_at: now },
      { name: 'Red String Hopper',   category: 'Main Dishes',  price: 5,  stock: 35, emoji: '🟥', section: 0, is_active: true, created_at: now, updated_at: now },
      { name: 'Rice Puttu',          category: 'Main Dishes',  price: 35, stock: 20, emoji: '🍚', section: 0, is_active: true, created_at: now, updated_at: now },
      { name: 'Wheat Puttu',         category: 'Main Dishes',  price: 40, stock: 18, emoji: '🌾', section: 0, is_active: true, created_at: now, updated_at: now },
      { name: 'Coconut Sambal',      category: 'Curries',      price: 20, stock: 50, emoji: '🥥', section: 1, is_active: true, created_at: now, updated_at: now },
      { name: 'Dal Curry',           category: 'Curries',      price: 40, stock: 30, emoji: '🫘', section: 1, is_active: true, created_at: now, updated_at: now },
      { name: 'Chicken Curry',       category: 'Curries',      price: 80, stock: 25, emoji: '🍗', section: 1, is_active: true, created_at: now, updated_at: now },
      { name: 'Beef Curry',          category: 'Curries',      price: 90, stock: 15, emoji: '🥩', section: 1, is_active: true, created_at: now, updated_at: now },
      { name: 'Dhal Vadai',          category: 'Short Eats',   price: 15, stock: 60, emoji: '🫓', section: 2, is_active: true, created_at: now, updated_at: now },
      { name: 'Ulunthu Vadai',       category: 'Short Eats',   price: 20, stock: 55, emoji: '🔵', section: 2, is_active: true, created_at: now, updated_at: now },
      { name: 'Ktlat',               category: 'Short Eats',   price: 30, stock: 40, emoji: '🟤', section: 2, is_active: true, created_at: now, updated_at: now },
      { name: 'Pettis',              category: 'Short Eats',   price: 10, stock: 70, emoji: '🟠', section: 2, is_active: true, created_at: now, updated_at: now },
    ]);

    // ── Stock Items ───────────────────────────────────────────────────────
    await queryInterface.bulkInsert('stock_items', [
      { name: 'Chicken',     unit: 'kg',    qty: 15, min_qty: 5,  price: 850,  is_active: true, created_at: now, updated_at: now },
      { name: 'Beef',        unit: 'kg',    qty: 8,  min_qty: 5,  price: 1100, is_active: true, created_at: now, updated_at: now },
      { name: 'Rice',        unit: 'kg',    qty: 50, min_qty: 10, price: 120,  is_active: true, created_at: now, updated_at: now },
      { name: 'Coconut',     unit: 'units', qty: 30, min_qty: 10, price: 75,   is_active: true, created_at: now, updated_at: now },
      { name: 'Dal',         unit: 'kg',    qty: 12, min_qty: 5,  price: 240,  is_active: true, created_at: now, updated_at: now },
      { name: 'Wheat Flour', unit: 'kg',    qty: 20, min_qty: 8,  price: 180,  is_active: true, created_at: now, updated_at: now },
      { name: 'Oil',         unit: 'L',     qty: 6,  min_qty: 3,  price: 480,  is_active: true, created_at: now, updated_at: now },
      { name: 'Onions',      unit: 'kg',    qty: 4,  min_qty: 5,  price: 160,  is_active: true, created_at: now, updated_at: now },
    ]);

    // ── Sample Customers ──────────────────────────────────────────────────
    await queryInterface.bulkInsert('customers', [
      { name: 'Amal Perera',   email: 'amal.p@example.com',    phone: '0711234567', status: 'active', credit_limit: 5000, outstanding_balance: 0,   total_purchases: 1250, created_at: now, updated_at: now },
      { name: 'Nimal Silva',   email: 'nimal.s@example.com',   phone: '0722345678', status: 'active', credit_limit: 3000, outstanding_balance: 850, total_purchases: 4300, created_at: now, updated_at: now },
      { name: 'Kasun Rajapaksa',email: 'kasun.r@example.com', phone: '0733456789', status: 'active', credit_limit: 2000, outstanding_balance: 0,   total_purchases: 780,  created_at: now, updated_at: now },
      { name: 'Dilini Fernando',email: 'dilini.f@example.com', phone: '0744567890', status: 'active', credit_limit: 1000, outstanding_balance: 200, total_purchases: 2100, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('customers',  null, {});
    await queryInterface.bulkDelete('stock_items', null, {});
    await queryInterface.bulkDelete('menu_items',  null, {});
    await queryInterface.bulkDelete('users',       null, {});
  },
};
