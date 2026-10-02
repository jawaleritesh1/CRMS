import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { asyncContext } from '../../core/context/asyncContext.js';

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.header('X-Correlation-ID') || `corr_${crypto.randomUUID()}`) as string;
  const requestId = `req_${crypto.randomUUID()}`;

  // Attach correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  asyncContext.run(
    {
      correlationId,
      requestId,
    },
    () => {
      next();
    }
  );
}
