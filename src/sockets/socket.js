'use strict';
const { Server }       = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const { logger }       = require('../utils/logger');

/**
 * Initialise Socket.io on the given HTTP server.
 *
 * Rooms:
 *  - kitchen  → admin + waiter staff
 *  - waiters  → waiter staff
 *  - cashiers → cashier staff
 *  - user:<id>→ individual customer room
 *
 * Events emitted by server:
 *  - order:new        { orderId, orderNo, tableNo, total }
 *  - order:status     { orderId, orderNo, status }
 *  - order:cancelled  { orderId, orderNo }
 *  - notification     { title, message, type }
 *  - stock:low        { itemId, name, qty }
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      (process.env.ALLOWED_ORIGINS || '').split(','),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── JWT Authentication middleware for Socket.io ──────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = verifyAccessToken(token);
      next();
    } catch (err) {
      next(new Error(err.message));
    }
  });

  io.on('connection', (socket) => {
    const { sub: userId, role } = socket.user;
    logger.info({ event: 'socket.connected', userId, role });

    // Join role-based rooms
    if (['admin', 'waiter'].includes(role))  socket.join('kitchen');
    if (role === 'waiter')                   socket.join('waiters');
    if (role === 'cashier')                  socket.join('cashiers');
    socket.join(`user:${userId}`);           // personal room

    // ── Client events ──────────────────────────────────────────────────────
    socket.on('order:subscribe', (orderId) => {
      socket.join(`order:${orderId}`);
      logger.debug({ event: 'socket.subscribed', userId, orderId });
    });

    socket.on('order:unsubscribe', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info({ event: 'socket.disconnected', userId, reason });
    });

    socket.on('error', (err) => {
      logger.error({ event: 'socket.error', userId, message: err.message });
    });
  });

  return io;
}

module.exports = { initSocket };
