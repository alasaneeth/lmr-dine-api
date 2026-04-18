// tests/unit/auth.service.test.js
'use strict';

jest.mock('../../src/repositories/user.repository', () => ({
  findByEmail:        jest.fn(),
  findByEmailPublic:  jest.fn(),
  findById:           jest.fn(),
  create:             jest.fn(),
  updateLastLogin:    jest.fn(),
  model:              { scope: jest.fn(() => ({ findByPk: jest.fn() })) },
}));
jest.mock('../../src/repositories/repositories', () => ({
  refreshTokenRepo: {
    create:         jest.fn(),
    findAll:        jest.fn(),
    revokeAllForUser: jest.fn(),
    hashToken:      jest.fn(),
    verifyToken:    jest.fn(),
  },
}));
jest.mock('../../src/utils/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
jest.mock('bcryptjs', () => ({
  hash:    jest.fn().mockResolvedValue('$hashed'),
  compare: jest.fn(),
}));

const bcrypt      = require('bcryptjs');
const userRepo    = require('../../src/repositories/user.repository');
const { refreshTokenRepo } = require('../../src/repositories/repositories');
const authService = require('../../src/services/auth.service');
const { AuthenticationError, ConflictError } = require('../../src/utils/errors');

beforeEach(() => jest.clearAllMocks());

describe('AuthService – register', () => {
  it('throws ConflictError when email already exists', async () => {
    userRepo.findByEmailPublic.mockResolvedValue({ id: '1', email: 'a@b.com' });
    await expect(authService.register({ name: 'Test', email: 'a@b.com', password: 'pass' }))
      .rejects.toThrow(ConflictError);
  });

  it('creates user and returns public profile', async () => {
    userRepo.findByEmailPublic.mockResolvedValue(null);
    userRepo.create.mockResolvedValue({ id: 'u1', name: 'Test User', email: 't@t.com', role: 'customer', initials: 'TU', status: 'active' });
    const result = await authService.register({ name: 'Test User', email: 't@t.com', password: 'Secret@1' });
    expect(result).toMatchObject({ name: 'Test User', email: 't@t.com', role: 'customer' });
    expect(result).not.toHaveProperty('password_hash');
  });
});

describe('AuthService – login', () => {
  it('throws AuthenticationError when user not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    await expect(authService.login({ email: 'x@x.com', password: 'pw' }))
      .rejects.toThrow(AuthenticationError);
  });

  it('throws AuthenticationError on wrong password', async () => {
    userRepo.findByEmail.mockResolvedValue({ id: 'u1', password_hash: '$hashed', status: 'active', mfa_enabled: false });
    bcrypt.compare.mockResolvedValue(false);
    await expect(authService.login({ email: 'x@x.com', password: 'wrong' }))
      .rejects.toThrow(AuthenticationError);
  });

  it('returns tokens and user on valid credentials', async () => {
    const mockUser = { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'admin', initials: 'A', status: 'active', mfa_enabled: false, password_hash: '$hashed' };
    userRepo.findByEmail.mockResolvedValue(mockUser);
    userRepo.updateLastLogin.mockResolvedValue();
    bcrypt.compare.mockResolvedValue(true);
    refreshTokenRepo.hashToken.mockResolvedValue('hashed_refresh');
    refreshTokenRepo.create.mockResolvedValue({});

    const result = await authService.login({ email: 'a@b.com', password: 'correct' });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user).toMatchObject({ email: 'a@b.com', role: 'admin' });
    expect(result.user).not.toHaveProperty('password_hash');
  });

  it('returns requiresMfa when MFA is enabled and no token provided', async () => {
    const mockUser = { id: 'u1', email: 'a@b.com', status: 'active', mfa_enabled: true, password_hash: '$h' };
    userRepo.findByEmail.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    const result = await authService.login({ email: 'a@b.com', password: 'correct' });
    expect(result).toEqual({ requiresMfa: true });
  });
});
