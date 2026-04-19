'use strict';
const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const compression    = require('compression');
const cookieParser   = require('cookie-parser');
const rateLimit      = require('express-rate-limit');
const path           = require('path');

const cfg            = require('./config/env');
const routes         = require('./routes');
const errorHandler   = require('./middlewares/error.middleware');
const { requestLogger } = require('./middlewares/logger.middleware');
const logger         = require('./utils/logger');

function createApp() {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────────────
  app.use(cors({
    origin:      cfg.cors.origins,
    credentials: true,
    methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ── Body parsers & cookies ──────────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // ── Compression ─────────────────────────────────────────────────────────
  app.use(compression());

  // ── Request logging ──────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Rate limiting ────────────────────────────────────────────────────────
  app.use('/api/', rateLimit({
    windowMs: cfg.rateLimit.windowMs,
    max:      cfg.rateLimit.max,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, error: { message: 'Too many requests', code: 'TOO_MANY_REQUESTS' } },
  }));

  // Stricter limit on auth endpoints
  app.use('/api/v1/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      20,
    message:  { success: false, error: { message: 'Too many login attempts', code: 'TOO_MANY_REQUESTS' } },
  }));

  // ── Static uploads ───────────────────────────────────────────────────────
  app.use('/uploads', express.static(path.join(process.cwd(), cfg.upload.dir)));

  // ── API routes ────────────────────────────────────────────────────────────
  app.use('/api/v1', routes);

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { message: 'Route not found', code: 'NOT_FOUND' },
    });
  });

  // ── Global error handler ──────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
