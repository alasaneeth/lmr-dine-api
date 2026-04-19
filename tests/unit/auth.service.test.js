'use strict';
const authService = require('../../src/services/auth.service');
const userRepo    = require('../../src/repositories/user.repository');
const { compare } = require('../../src/utils/password');
const AppError    = require('../../src/errors/AppError');

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/utils/password');
jest.mock('../../src/models', () => ({
  RefreshToken: { create: jest.fn(), findOne: jest.fn(), update: jest.fn() },
  AuditLog:     { create: jest.fn() },
}));

const mockUser = {
  id:          1,
  email:       'admin@resto.lk',
  passwordHash:'hashed',
  role:        'admin',
  status:      'active',
  mfaEnabled:  false,
  save:        jest.fn().mockResolvedValue(true),
  toSafeJSON:  () => ({ id: 1, email: 'admin@resto.lk', role: 'admin' }),
};

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── register ────────────────────────────────────────────────────────────
  describe('register', () => {
    it('throws CONFLICT if email already exists', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      await expect(authService.register({ email: 'admin@resto.lk', password: 'pass', name: 'Test' }))
        .rejects.toMatchObject({ statusCode: 409 });
    });

    it('creates user successfully', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.create.mockResolvedValue({ ...mockUser, toSafeJSON: mockUser.toSafeJSON });
      const result = await authService.register({ email: 'new@test.com', password: 'pass123', name: 'New User' });
      expect(result).toHaveProperty('email');
      expect(userRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  // ── login ───────────────────────────────────────────────────────────────
  describe('login', () => {
    it('throws UNAUTHORIZED for unknown email', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      await expect(authService.login({ email: 'x@x.com', password: 'pass' }))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws UNAUTHORIZED for wrong password', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      compare.mockResolvedValue(false);
      await expect(authService.login({ email: 'admin@resto.lk', password: 'wrong' }))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('returns tokens on valid credentials', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      compare.mockResolvedValue(true);
      const { RefreshToken, AuditLog } = require('../../src/models');
      RefreshToken.create.mockResolvedValue({});
      AuditLog.create.mockResolvedValue({});

      const result = await authService.login({ email: 'admin@resto.lk', password: 'admin123' });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('returns requiresMfa flag when MFA enabled', async () => {
      const mfaUser = { ...mockUser, mfaEnabled: true, mfaSecret: 'secret' };
      userRepo.findByEmail.mockResolvedValue(mfaUser);
      compare.mockResolvedValue(true);
      const result = await authService.login({ email: 'admin@resto.lk', password: 'pass' });
      expect(result).toEqual({ requiresMfa: true });
    });

    it('throws FORBIDDEN for inactive user', async () => {
      userRepo.findByEmail.mockResolvedValue({ ...mockUser, status: 'inactive' });
      compare.mockResolvedValue(true);
      await expect(authService.login({ email: 'admin@resto.lk', password: 'pass' }))
        .rejects.toMatchObject({ statusCode: 403 });
    });
  });
});
