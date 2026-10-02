import { Router, Request, Response } from 'express';
import { prisma } from '../core/database/prisma.js';

export const healthRouter = Router();

// Liveness endpoint: fast, unauthenticated, verifies process is running
healthRouter.get('/liveness', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Readiness endpoint: verifies DB and infrastructure dependencies are active
healthRouter.get('/readiness', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {
    database: 'UNKNOWN',
  };

  let allHealthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'UP';
  } catch (error) {
    checks.database = 'DOWN';
    allHealthy = false;
  }

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: allHealthy ? 'READY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    checks,
  });
});
