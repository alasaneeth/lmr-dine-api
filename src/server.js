'use strict';
require('dotenv').config();
const http           = require('http');
const { createApp }  = require('./app');
const { connectDB }  = require('./models');
const { initSocket } = require('./sockets/socket');
const { logger }     = require('./utils/logger');

const PORT = parseInt(process.env.PORT || '5000', 10);

async function bootstrap() {
  // 1. Connect to MySQL
  await connectDB();

  // 2. Create Express app
  const app        = createApp();
  const httpServer = http.createServer(app);

  // 3. Attach Socket.io
  const io = initSocket(httpServer);
  app.set('io', io); // accessible in controllers via req.app.get('io')

  // 4. Start listening
  httpServer.listen(PORT, () => {
    logger.info(`🚀  RestoMS API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info(`    http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received – graceful shutdown`);
    httpServer.close(async () => {
      const { sequelize } = require('./models');
      await sequelize.close();
      logger.info('MySQL connection closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException',  (err) => { logger.error('Uncaught exception', err);  process.exit(1); });
  process.on('unhandledRejection', (err) => { logger.error('Unhandled rejection', err); process.exit(1); });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
