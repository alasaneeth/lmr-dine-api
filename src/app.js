'use strict';
require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const compression= require('compression');
const cookieParser = require('cookie-parser');
const path       = require('path');
const fs         = require('fs');

const {
  requestLogger, globalLimiter, errorHandler, notFound,
} = require('./middleware/middleware');
const apiRoutes  = require('./routes/index');
const { logger } = require('./utils/logger');

/**
 * Create and configure the Express application.
 * Separating app creation from server startup lets tests
 * import the app without binding to a port.
 */
function createApp() {
  const app = express();

  // ── Uploads directory ─────────────────────────────────────────────────────
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow image serving
  }));

  // ── CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials:      true,
    methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders:   ['Content-Type', 'Authorization'],
    exposedHeaders:   ['X-Total-Count'],
  }));

  // ── Body parsing & compression ────────────────────────────────────────────
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // ── HTTP request logging ──────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Global rate limiter ───────────────────────────────────────────────────
  app.use(globalLimiter);

  // ── Static file serving (uploads) ────────────────────────────────────────
  app.use('/uploads', express.static(uploadDir));

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/health', (req, res) => res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  // ── API routes ────────────────────────────────────────────────────────────
  const prefix = process.env.API_PREFIX || '/api/v1';
  app.use(prefix, apiRoutes);

  // ── 404 & Global error handler (must be last) ─────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
