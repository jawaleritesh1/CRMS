import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { correlationMiddleware } from './api/middlewares/correlationMiddleware.js';
import { errorMiddleware } from './core/errors/errorMiddleware.js';
import { ResourceNotFoundError } from './core/errors/appError.js';
import { healthRouter } from './api/health.routes.js';
import { authRouter } from './api/auth.routes.js';
import { leadRouter } from './api/lead.routes.js';
import { inventoryRouter } from './api/inventory.routes.js';
import { webhookRouter } from './api/webhook.routes.js';
import { reportRouter } from './api/report.routes.js';
import { telephonyRouter } from './api/telephony.routes.js';
import { metaRouter } from './api/meta.routes.js';
import { authRateLimiter, webhookRateLimiter } from './security/middleware/rateLimiter.js';
import { logger } from './core/logging/logger.js';

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'Idempotency-Key'],
      exposedHeaders: ['X-Correlation-ID'],
    })
  );

  // Correlation tracking across async contexts
  app.use(correlationMiddleware);

  // Body parser with 2mb limit
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // HTTP Request Logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info({
        msg: 'HTTP Request Completed',
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: duration,
      });
    });
    next();
  });

  // Health checks
  app.use('/health', healthRouter);

  // Authentication routes (protected by authRateLimiter)
  app.use(`${env.API_PREFIX}/auth`, authRateLimiter, authRouter);

  // Lead management routes
  app.use(`${env.API_PREFIX}/leads`, leadRouter);

  // Inventory management routes
  app.use(`${env.API_PREFIX}/inventory`, inventoryRouter);

  // Webhook ingestion routes (§21.1, protected by webhookRateLimiter)
  app.use('/api/webhooks', webhookRateLimiter, webhookRouter);

  // Reporting and Analytics routes (§33)
  app.use(`${env.API_PREFIX}/reports`, reportRouter);

  // Telephony & Calling routes (§19.1 - Knowlarity SuperReceptionist)
  app.use(`${env.API_PREFIX}/telephony`, telephonyRouter);

  // Meta Lead Ads & External Integration routes (§21.1)
  app.use(`${env.API_PREFIX}/integrations/meta`, metaRouter);

  // Catch-all 404 handler
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new ResourceNotFoundError('Endpoint not found'));
  });

  // Standardized Error Middleware
  app.use(errorMiddleware);

  return app;
}
