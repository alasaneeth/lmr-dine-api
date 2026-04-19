'use strict';
const { Server }       = require('socket.io');
const { verifyAccess } = require('../utils/jwt');
const logger           = require('../utils/logger');
const cfg              = require('../config/env');

/**
 * Initialise Socket.io on the HTTP server.
 * Authenticates every connection via JWT (same access token as REST API).
 * Returns the io instance so controllers can call io.emit().
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      cfg.cors.origins,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const payload  = verifyAccess(token);
      socket.userId  = payload.sub;
      socket.role    = payload.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ───────────────────────────────────────────────────
  io.on('connection', (socket) => {
    logger.info(`Socket connected: userId=${socket.userId} role=${socket.role}`);

    // Join role-based rooms so we can target broadcasts
    socket.join(`role:${socket.role}`);
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: userId=${socket.userId}`);
    });

    // Client can subscribe to a specific order's updates
    socket.on('order:subscribe', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('order:unsubscribe', (orderId) => {
      socket.leave(`order:${orderId}`);
    });
  });

  return io;
}

module.exports = { initSocket };
