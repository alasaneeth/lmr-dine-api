'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const adminId    = uuidv4();
const waiterId   = uuidv4();
const cashierId  = uuidv4();
const customerId = uuidv4();

const catMainId    = uuidv4();
const catCurriesId = uuidv4();
const catShortId   = uuidv4();

module.exports = {
  async up(queryInterface) {
    const hash = (pw) => bcrypt.hashSync(pw, 10);
    const now  = new Date();

    // ── Users ──────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('users', [
      { id: adminId,    name: 'Kavindu Dilshan', email: 'admin@resto.lk',    password_hash: hash('Admin@123'),    role: 'admin',    status: 'active', initials: 'KD', created_at: now, updated_at: now },
      { id: waiterId,   name: 'Nimal Perera',    email: 'waiter@resto.lk',   password_hash: hash('Waiter@123'),   role: 'waiter',   status: 'active', initials: 'NP', created_at: now, updated_at: now },
      { id: cashierId,  name: 'Samitha Bandara', email: 'cashier@resto.lk',  password_hash: hash('Cashier@123'),  role: 'cashier',  status: 'active', initials: 'SB', created_at: now, updated_at: now },
      { id: customerId, name: 'Dilini Fernando', email: 'customer@resto.lk', password_hash: hash('Customer@123'), role: 'customer', status: 'active', initials: 'DF', created_at: now, updated_at: now },
    ]);

    // ── Categories ─────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('categories', [
      { id: catMainId,    name: 'Main Dishes', sort_order: 0, created_at: now, updated_at: now },
      { id: catCurriesId, name: 'Curries',     sort_order: 1, created_at: now, updated_at: now },
      { id: catShortId,   name: 'Short Eats',  sort_order: 2, created_at: now, updated_at: now },
    ]);

    // ── Menu items ─────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('menu_items', [
      { id: uuidv4(), category_id: catMainId,    name: 'White String Hopper', price: 5,  emoji: '⬜', stock: 40, is_available: true, created_at: now, updated_at: now },
      { id: uuidv4(), category_id: catMainId,    name: 'Red String Hopper',   price: 5,  emoji: '🟥', stock: 35, is_available: true, created_at: now, updated_at: now },
      { id: uuidv4(), category_id: catMainId,    name: 'Rice Puttu',           price: 35, emoji: '🍚', stock: 20, is_available: true, created_at: now, updated_at: now },
      { id: uuidv4(), category_id: catMainId,    name: 'Wheat Puttu',          price: 40, emoji: '🌾', stock: 18, is_available: true, created_at: now, updated_at: now },
      { id: uuidv4(), category_id: catCurriesId, name: 'Coconut Sambal',       price: 20, emoji: '🥥', stock: 50, is_available: true, created_at: now, updated_at: now },
      { id: uuidv4(), category_id: catCurriesId, name: 'Dal Curry',            price: 40, emoji: '🫘', stock: 30, is_available: true, created_at: now, updated_at: now },
      { id: uuidv4(), category_id: catCurriesId, name: 'Chicken Curry',        price: 80, emoji: '🍗', stock: 25, is_available: true, created_at: now, updated_at: now },
      { id: uuidv4(), category_id: catCurriesId, name: 'Beef Curry',           price: 90, emoji: '🥩', stock: 15, is_available: true, created_at: now, updated_at: now },
      { id: uuidv4(), category_id: catShortId,   name: 'Dhal Vadai',           price: 15, emoji: '🫓', stock: 60, is_available: true, created_at: now, updated_at: now },
      { id: uuidv4(), category_id: catShortId,   name: 'Ulunthu Vadai',        price: 20, emoji: '🔵', stock: 55, is_available: true, created_at: now, updated_at: now },
      { id: uuidv4(), category_id: catShortId,   name: 'Ktlat',                price: 30, emoji: '🟤', stock: 40, is_available: true, created_at: now, updated_at: now },
      { id: uuidv4(), category_id: catShortId,   name: 'Pettis',               price: 10, emoji: '🟠', stock: 70, is_available: true, created_at: now, updated_at: now },
    ]);

    // ── Stock items ────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('stock_items', [
      { id: uuidv4(), name: 'Chicken',     unit: 'kg',    qty: 15, min_qty: 5,  price: 850,  created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Beef',        unit: 'kg',    qty: 8,  min_qty: 5,  price: 1100, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Rice',        unit: 'kg',    qty: 50, min_qty: 10, price: 120,  created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Coconut',     unit: 'units', qty: 30, min_qty: 10, price: 75,   created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Dal',         unit: 'kg',    qty: 12, min_qty: 5,  price: 240,  created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Wheat Flour', unit: 'kg',    qty: 20, min_qty: 8,  price: 180,  created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Oil',         unit: 'L',     qty: 6,  min_qty: 3,  price: 480,  created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Onions',      unit: 'kg',    qty: 4,  min_qty: 5,  price: 160,  created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stock_items', null, {});
    await queryInterface.bulkDelete('menu_items',  null, {});
    await queryInterface.bulkDelete('categories',  null, {});
    await queryInterface.bulkDelete('users',       null, {});
  },
};
