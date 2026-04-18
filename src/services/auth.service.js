'use strict';
const bcrypt              = require('bcryptjs');
const { authenticator }   = require('otplib');
const QRCode              = require('qrcode');
const userRepo            = require('../repositories/user.repository');
const { refreshTokenRepo } = require('../repositories/repositories');
const {
  signAccessToken, signRefreshToken,
  verifyRefreshToken, expiryToDate, REFRESH_EXPIRY,
} = require('../utils/jwt');
const {
  AuthenticationError, ConflictError, BadRequestError,
} = require('../utils/errors');
const { logger } = require('../utils/logger');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

class AuthService {

  // ── Register ──────────────────────────────────────────────────────────────
  async register({ name, email, password, role = 'customer' }) {
    const existing = await userRepo.findByEmailPublic(email);
    if (existing) throw new ConflictError('Email already registered');

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 4);

    const user = await userRepo.create({ name, email, password_hash, role, initials });
    logger.info({ event: 'user.registered', userId: user.id, role });
    return this._userPublic(user);
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async login({ email, password, mfaToken }, { userAgent, ip } = {}) {
    // Use withPassword scope to retrieve hashed password
    const user = await userRepo.findByEmail(email);
    if (!user) throw new AuthenticationError('Invalid credentials');
    if (user.status !== 'active') throw new AuthenticationError('Account is not active');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AuthenticationError('Invalid credentials');

    // MFA check
    if (user.mfa_enabled) {
      if (!mfaToken) {
        return { requiresMfa: true };
      }
      const secret = user.mfa_secret;
      const ok = authenticator.verify({ token: mfaToken, secret });
      if (!ok) throw new AuthenticationError('Invalid MFA token');
    }

    await userRepo.updateLastLogin(user.id);

    const tokens = await this._issueTokenPair(user, { userAgent, ip });
    logger.info({ event: 'user.login', userId: user.id });
    return { user: this._userPublic(user), ...tokens };
  }

  // ── Refresh tokens ────────────────────────────────────────────────────────
  async refresh(rawRefreshToken, { userAgent, ip } = {}) {
    // Verify JWT structure first
    const payload = verifyRefreshToken(rawRefreshToken);

    // Verify it exists in DB and isn't revoked
    const tokenHash = await refreshTokenRepo.hashToken(rawRefreshToken);
    // We stored a hash, so we need to find by user then compare
    const storedTokens = await refreshTokenRepo.findAll({
      where: { user_id: payload.sub, is_revoked: false },
    });

    let storedToken = null;
    for (const t of storedTokens) {
      const match = await refreshTokenRepo.verifyToken(rawRefreshToken, t.token_hash);
      if (match) { storedToken = t; break; }
    }

    if (!storedToken || storedToken.is_revoked || new Date() > storedToken.expires_at) {
      // Token reuse detected – revoke entire family
      await refreshTokenRepo.revokeAllForUser(payload.sub);
      throw new AuthenticationError('Refresh token reuse detected — please log in again');
    }

    const user = await userRepo.findById(payload.sub);
    if (user.status !== 'active') throw new AuthenticationError('Account is not active');

    // Rotate: revoke old, issue new pair
    await storedToken.update({ is_revoked: true, replaced_by: 'rotation' });

    const tokens = await this._issueTokenPair(user, { userAgent, ip });
    return { user: this._userPublic(user), ...tokens };
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async logout(userId) {
    await refreshTokenRepo.revokeAllForUser(userId);
    logger.info({ event: 'user.logout', userId });
  }

  // ── MFA Setup ─────────────────────────────────────────────────────────────
  async setupMfa(userId) {
    const secret  = authenticator.generateSecret();
    const user    = await userRepo.findById(userId);
    await userRepo.model.scope('withPassword').findByPk(userId)
      .then((u) => u.update({ mfa_secret: secret }));

    const otpAuthUrl = authenticator.keyuri(user.email, process.env.MFA_ISSUER || 'RestoMS', secret);
    const qrCode     = await QRCode.toDataURL(otpAuthUrl);
    return { secret, qrCode, otpAuthUrl };
  }

  async enableMfa(userId, token) {
    const raw  = await userRepo.model.scope('withPassword').findByPk(userId);
    const ok   = authenticator.verify({ token, secret: raw.mfa_secret });
    if (!ok) throw new BadRequestError('Invalid MFA token');
    await raw.update({ mfa_enabled: true });
    return { mfaEnabled: true };
  }

  async disableMfa(userId) {
    await userRepo.model.scope('withPassword').findByPk(userId)
      .then((u) => u.update({ mfa_enabled: false, mfa_secret: null }));
    return { mfaEnabled: false };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  async _issueTokenPair(user, { userAgent, ip } = {}) {
    const accessPayload = {
      sub:   user.id,
      email: user.email,
      role:  user.role,
      name:  user.name,
    };
    const accessToken  = signAccessToken(accessPayload);
    const rawRefresh   = signRefreshToken(user.id);
    const tokenHash    = await refreshTokenRepo.hashToken(rawRefresh);

    await refreshTokenRepo.create({
      user_id:    user.id,
      token_hash: tokenHash,
      expires_at: expiryToDate(REFRESH_EXPIRY),
      user_agent: userAgent,
      ip_address: ip,
    });

    return { accessToken, refreshToken: rawRefresh };
  }

  _userPublic(user) {
    return {
      id:       user.id,
      name:     user.name,
      email:    user.email,
      role:     user.role,
      initials: user.initials,
      status:   user.status,
    };
  }
}

module.exports = new AuthService();
