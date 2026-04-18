// tests/integration/auth.routes.test.js
'use strict';

// Mock DB before importing app
jest.mock('../../src/models', () => ({
  sequelize: { authenticate: jest.fn(), transaction: jest.fn((fn) => fn({ commit: jest.fn(), rollback: jest.fn() })) },
  connectDB: jest.fn(),
  User:         { findOne: jest.fn(), create: jest.fn(), update: jest.fn(), findByPk: jest.fn(), count: jest.fn() },
  RefreshToken: { create: jest.fn(), findOne: jest.fn(), update: jest.fn(), findAll: jest.fn(), destroy: jest.fn() },
  Order:        {},
  OrderItem:    {},
  MenuItem:     {},
  Invoice:      {},
  StockItem:    {},
  Category:     {},
  Notification: {},
}));

jest.mock('../../src/repositories/user.repository', () => ({
  findByEmail:       jest.fn(),
  findByEmailPublic: jest.fn(),
  findById:          jest.fn(),
  create:            jest.fn(),
  updateLastLogin:   jest.fn(),
  model:             { scope: jest.fn(() => ({ findByPk: jest.fn() })) },
}));

jest.mock('../../src/repositories/repositories', () => ({
  refreshTokenRepo: {
    create:           jest.fn(),
    findAll:          jest.fn().mockResolvedValue([]),
    revokeAllForUser: jest.fn(),
    hashToken:        jest.fn().mockResolvedValue('hashed'),
    verifyToken:      jest.fn().mockResolvedValue(false),
    purgeExpired:     jest.fn(),
  },
  menuItemRepo:    {},
  orderRepo:       {},
  invoiceRepo:     {},
  stockItemRepo:   {},
  notificationRepo:{},
}));

jest.mock('bcryptjs', () => ({
  hash:    jest.fn().mockResolvedValue('$2b$hashed'),
  compare: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  logger:        { info: jest.fn(), warn: jest.fn(), error: jest.fn(), http: jest.fn(), debug: jest.fn() },
  httpLogStream: { write: jest.fn() },
}));

const supertest   = require('supertest');
const bcrypt      = require('bcryptjs');
const userRepo    = require('../../src/repositories/user.repository');
const { createApp } = require('../../src/app');

const app = createApp();

// ── POST /api/v1/auth/register ────────────────────────────────────────────────
describe('POST /api/v1/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 422 on missing fields', async () => {
    const res = await supertest(app)
      .post('/api/v1/auth/register')
      .send({ email: 'bad' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 409 when email already exists', async () => {
    userRepo.findByEmailPublic.mockResolvedValue({ id: '1' });
    const res = await supertest(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'a@b.com', password: 'Secret@123' });
    expect(res.status).toBe(409);
  });

  it('returns 201 on successful registration', async () => {
    userRepo.findByEmailPublic.mockResolvedValue(null);
    userRepo.create.mockResolvedValue({
      id: 'u1', name: 'Test', email: 'new@b.com', role: 'customer', initials: 'T', status: 'active',
    });
    const res = await supertest(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'new@b.com', password: 'Secret@123' });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: 'new@b.com' });
  });
});

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 422 on invalid email format', async () => {
    const res = await supertest(app)
      .post('/api/v1/auth/login')
      .send({ email: 'notanemail', password: 'pw' });
    expect(res.status).toBe(422);
  });

  it('returns 401 on invalid credentials', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    const res = await supertest(app)
      .post('/api/v1/auth/login')
      .send({ email: 'x@x.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 200 with accessToken on valid login', async () => {
    userRepo.findByEmail.mockResolvedValue({
      id: 'u1', email: 'a@b.com', name: 'Alice', role: 'admin',
      initials: 'A', status: 'active', mfa_enabled: false,
      password_hash: '$2b$hashed',
    });
    userRepo.updateLastLogin.mockResolvedValue();
    bcrypt.compare.mockResolvedValue(true);
    const { refreshTokenRepo } = require('../../src/repositories/repositories');
    refreshTokenRepo.hashToken.mockResolvedValue('hashed_rt');
    refreshTokenRepo.create.mockResolvedValue({});

    const res = await supertest(app)
      .post('/api/v1/auth/login')
      .send({ email: 'a@b.com', password: 'correct' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user).toMatchObject({ role: 'admin' });
  });
});

// ── GET /health ───────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await supertest(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
describe('Unknown route', () => {
  it('returns 404 with NOT_FOUND code', async () => {
    const res = await supertest(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
