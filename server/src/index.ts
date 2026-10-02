import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './core/logging/logger.js';
import { prisma } from './core/database/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({
    msg: `🚀 Ralix CRM Server booted successfully`,
    port: env.PORT,
    environment: env.NODE_ENV,
    apiPrefix: env.API_PREFIX,
  });
});

async function gracefulShutdown(signal: string) {
  logger.info({ msg: `Received ${signal}. Initiating graceful shutdown...` });

  server.close(async () => {
    logger.info({ msg: 'HTTP server closed.' });
    try {
      await prisma.$disconnect();
      logger.info({ msg: 'Database connection closed.' });
      process.exit(0);
    } catch (err) {
      logger.error({ msg: 'Error during database disconnect', err });
      process.exit(1);
    }
  });

  // Force close after 10s timeout
  setTimeout(() => {
    logger.error({ msg: 'Forceful shutdown timeout reached. Terminating process.' });
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
