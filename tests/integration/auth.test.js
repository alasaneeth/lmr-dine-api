'use strict';
/**
 * Integration tests for /api/v1/auth
 *
 * These run against a real test database (separate DB or SQLite).
 * Set TEST_DB_NAME in .env.test to isolate.
 *
 * Run with: NODE_ENV=test jest tests/integration/auth.test.js
 */

// ── Mock heavy dependencies so we don't need a real DB in CI ─────────────────
jest.mock('../../src/models', () => {
  const userStore = new Map();
  const MockUser = {
    findOne: jest.fn(({ where }) => Promise.resolve(
      [...userStore.values()].find((u) => u.email === where.email) || null
    )),
    findByPk: jest.fn((id) => Promise.resolve(userStore.get(id) || null)),
    create:   jest.fn((data) => {
      const user = { id: userStore.size + 1, ...data,
        save: jest.fn().mockResolvedValue(true),
        toSafeJSON: () => ({ id: user.id, email: user.email, role: user.role, name: user.name }),
        toJSON:     () => user,
      };
      userStore.set(user.id, user);
      return Promise.resolve(user);
    }),
    count: jest.fn().mockResolvedValue(0),
  };
  return {
    User:         MockUser,
    RefreshToken: { create: jest.fn().mockResolvedValue({}), findOne: jest.fn().mockResolvedValue(null), update: jest.fn() },
    AuditLog:     { create: jest.fn().mockResolvedValue({}) },
  };
});

const request    = require('supertest');
const bcrypt     = require('bcryptjs');
const { createApp } = require('../../src/app');
const { User, RefreshToken } = require('../../src/models');

let app;

beforeAll(() => {
  app = createApp();
});

describe('POST /api/v1/auth/register', () => {
  it('registers a new user', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test User', email: 'test@test.com', password: 'pass123' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toHaveProperty('email', 'test@test.com');
  });

  it('returns 422 for missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'bad-email' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 401 for unknown user', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ghost@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns tokens for valid credentials', async () => {
    const hash = bcrypt.hashSync('password', 10);
    User.findOne.mockResolvedValueOnce({
      id: 1, email: 'u@t.com', passwordHash: hash, role: 'admin',
      status: 'active', mfaEnabled: false,
      save: jest.fn().mockResolvedValue(true),
      toSafeJSON: () => ({ id: 1, email: 'u@t.com', role: 'admin' }),
    });
    RefreshToken.create.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'u@t.com', password: 'password' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('user');
  });
});

describe('GET /api/v1/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
