'use strict';
jest.mock('../../src/config/database', () => ({
  sequelize: { authenticate: jest.fn(), sync: jest.fn(), transaction: jest.fn() },
  connectDB: jest.fn(),
}));

jest.mock('../../src/models', () => ({
  User:         { findByPk: jest.fn(), findOne: jest.fn() },
  MenuItem:     { findAndCountAll: jest.fn() },
  Order:        { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn() },
  OrderItem:    { bulkCreate: jest.fn() },
  AuditLog:     { create: jest.fn() },
  RefreshToken: { findOne: jest.fn() },
  Customer:     { findByPk: jest.fn() },
  Invoice:      { findAndCountAll: jest.fn() },
  StockItem:    { findAndCountAll: jest.fn() },
}));

jest.mock('../../src/repositories/user.repository', () => ({
  list:        jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 }),
  findByEmail: jest.fn(),
  findById:    jest.fn(),
  create:      jest.fn(),
}));

const request       = require('supertest');
const jwt           = require('jsonwebtoken');
const { createApp } = require('../../src/app');
const { MenuItem, User } = require('../../src/models');

const SECRET = process.env.JWT_ACCESS_SECRET;
let app;

beforeAll(() => {
  app = createApp();
});

afterEach(() => jest.clearAllMocks());

describe('GET /api/v1/menu', () => {
  it('returns paginated items without auth', async () => {
    MenuItem.findAndCountAll.mockResolvedValue({
      rows: [{ id: 1, name: 'Chicken Curry', price: 80 }], count: 1,
    });
    const res = await request(app).get('/api/v1/menu');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
  });
});

describe('Auth guard', () => {
  it('401 with no token', async () => {
    expect((await request(app).get('/api/v1/users')).status).toBe(401);
  });

  it('401 when user not in DB (stale token)', async () => {
    const token = jwt.sign({ sub: 999, role: 'admin' }, SECRET, { expiresIn: '1h', issuer: 'rms-api' });
    User.findOne.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('authorize() rejects wrong role with 403 error', () => {
    const { authorize } = require('../../src/middlewares/auth.middleware');
    const next = jest.fn();
    authorize('admin')({ user: { role: 'waiter' } }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('authorize() allows correct role', () => {
    const { authorize } = require('../../src/middlewares/auth.middleware');
    const next = jest.fn();
    authorize('admin', 'cashier')({ user: { role: 'admin' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('valid admin token passes auth on /users (not 401/403)', async () => {
    const token = jwt.sign({ sub: 1, role: 'admin' }, SECRET, { expiresIn: '1h', issuer: 'rms-api' });
    User.findOne.mockResolvedValue({ id: 1, role: 'admin', status: 'active', toJSON: () => ({}) });
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

describe('GET /api/v1/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
