'use strict';
require('dotenv').config();
const http           = require('http');
const { createApp }  = require('./src/app');
const { connectDB }  = require('./src/config/database');
const { initSocket } = require('./src/socket');
const logger         = require('./src/utils/logger');
const cfg            = require('./src/config/env');
const fs             = require('fs');
const path           = require('path');

// Ensure upload dirs exist
const uploadDirs = ['uploads', 'uploads/menu', 'logs'];
uploadDirs.forEach((d) => {
  const full = path.join(process.cwd(), d);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

async function bootstrap() {
  // 1. Connect to MySQL
  await connectDB();

  // 2. Sync models in development (use migrations in production)
  if (cfg.env === 'development') {
    const { sequelize } = require('./src/config/database');
    await sequelize.sync({ alter: true });
    logger.info('📦  Database synced (development mode)');
  }

  // 3. Create Express app
  const app = createApp();

  // 4. Create HTTP server
  const server = http.createServer(app);

  // 5. Attach Socket.io
  const io = initSocket(server);
  app.set('io', io);          // make io available in controllers via req.app.get('io')

  // 6. Start listening
  server.listen(cfg.port, () => {
    logger.info(`🚀  RMS API running on port ${cfg.port} [${cfg.env}]`);
    logger.info(`📡  Socket.io ready`);
    logger.info(`🗄️   API base: http://localhost:${cfg.port}/api/v1`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received – shutting down gracefully…`);
    server.close(async () => {
      const { sequelize } = require('./src/config/database');
      await sequelize.close();
      logger.info('MySQL connection closed.');
      process.exit(0);
    });
    setTimeout(() => { logger.error('Forced shutdown'); process.exit(1); }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
