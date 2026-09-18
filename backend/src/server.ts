import 'dotenv/config';
import app from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { config } from './config';
import { logger } from './utils/logger';

async function bootstrap() {
  await connectDatabase();
  await connectRedis();

  const server = app.listen(config.port, () => {
    logger.info(`🚀 VELOUR API running on port ${config.port} [${config.env}]`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received — shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection:', err);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
  });
}

bootstrap();
