'use strict';
const crypto      = require('crypto');
const { v4: uuidv4 } = require('uuid');
const bcrypt      = require('bcryptjs');
const { totp }    = require('otplib');
const QRCode      = require('qrcode');

const userRepo    = require('../repositories/user.repository');
const { RefreshToken, AuditLog } = require('../models');
const { hash, compare }          = require('../utils/password');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const AppError    = require('../errors/AppError');
const cfg         = require('../config/env');

// ── helpers ───────────────────────────────────────────────────────────────────
const hashToken  = (t) => crypto.createHash('sha256').update(t).digest('hex');
const parseDays  = (str) => {
  const match = str.match(/^(\d+)d$/);
  return match ? parseInt(match[1], 10) * 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000;
};

async function issueTokenPair(user, meta = {}) {
  const payload     = { sub: user.id, role: user.role };
  const accessToken = signAccess(payload);
  const rawRefresh  = uuidv4();
  const family      = meta.family || uuidv4();

  await RefreshToken.create({
    userId:    user.id,
    tokenHash: hashToken(rawRefresh),
    family,
    expiresAt: new Date(Date.now() + parseDays(cfg.jwt.refreshExpires)),
    userAgent: meta.userAgent,
    ip:        meta.ip,
  });

  return { accessToken, refreshToken: rawRefresh };
}

// ── Auth Service ──────────────────────────────────────────────────────────────
const authService = {
  async register(data) {
    const existing = await userRepo.findByEmail(data.email);
    if (existing) throw AppError.conflict('Email already registered');
    const passwordHash = await hash(data.password);
    const user = await userRepo.create({ ...data, passwordHash });
    return user.toSafeJSON();
  },

  async login({ email, password, mfaToken }, meta = {}) {
    const user = await userRepo.findByEmail(email);
    if (!user) throw AppError.unauthorized('Invalid credentials');

    const valid = await compare(password, user.passwordHash);
    if (!valid)  throw AppError.unauthorized('Invalid credentials');

    if (user.status !== 'active') throw AppError.forbidden('Account is inactive');

    // MFA check
    if (user.mfaEnabled) {
      if (!mfaToken) return { requiresMfa: true };
      const ok = totp.check(mfaToken, user.mfaSecret);
      if (!ok) throw AppError.unauthorized('Invalid MFA token');
    }

    user.lastLoginAt = new Date();
    await user.save();

    await AuditLog.create({ userId: user.id, action: 'USER_LOGIN', ip: meta.ip, userAgent: meta.userAgent });

    const tokens = await issueTokenPair(user, meta);
    return { user: user.toSafeJSON(), ...tokens };
  },

  async refresh(rawToken, meta = {}) {
    if (!rawToken) throw AppError.unauthorized('Refresh token missing');
    const tokenHash = hashToken(rawToken);

    const stored = await RefreshToken.findOne({ where: { tokenHash } });
    if (!stored || stored.revokedAt || new Date() > stored.expiresAt) {
      // Token reuse detection – revoke entire family
      if (stored) {
        await RefreshToken.update(
          { revokedAt: new Date() },
          { where: { family: stored.family } }
        );
      }
      throw AppError.unauthorized('Refresh token invalid or expired');
    }

    // Rotate: revoke old, issue new in same family
    stored.revokedAt = new Date();
    await stored.save();

    const user = await userRepo.findByEmail((await stored.getUser()).email);
    const tokens = await issueTokenPair(user, { ...meta, family: stored.family });
    return { user: user.toSafeJSON(), ...tokens };
  },

  async logout(rawToken) {
    if (!rawToken) return;
    const tokenHash = hashToken(rawToken);
    await RefreshToken.update({ revokedAt: new Date() }, { where: { tokenHash } });
  },

  async me(userId) {
    const user = await userRepo.findById(userId, {
      attributes: { exclude: ['passwordHash', 'mfaSecret'] },
    });
    return { user: user.toJSON() };
  },

  async setupMfa(userId) {
    const user   = await userRepo.findById(userId);
    if (user.mfaEnabled) throw AppError.conflict('MFA is already enabled');
    const secret = totp.generateSecret();
    user.mfaSecret = secret;
    await user.save();
    const otpauth = totp.keyuri(user.email, 'RMS', secret);
    const qrCode  = await QRCode.toDataURL(otpauth);
    return { secret, qrCode };
  },

  async enableMfa(userId, token) {
    const user = await userRepo.findById(userId);
    if (!user.mfaSecret) throw AppError.badRequest('Run MFA setup first');
    const ok = totp.check(token, user.mfaSecret);
    if (!ok) throw AppError.unauthorized('Invalid TOTP token');
    user.mfaEnabled = true;
    await user.save();
    return { mfaEnabled: true };
  },

  async disableMfa(userId) {
    const user = await userRepo.findById(userId);
    user.mfaEnabled = false;
    user.mfaSecret  = null;
    await user.save();
    return { mfaEnabled: false };
  },
};

module.exports = authService;
