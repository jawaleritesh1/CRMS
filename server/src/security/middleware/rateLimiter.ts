import { Request, Response, NextFunction } from 'express';
import { RateLimitedError } from '../../core/errors/appError.js';

interface RateLimitRecord {
  tokens: number;
  lastRefillTime: number;
}

export interface RateLimitOptions {
  windowMs: number; // e.g., 60000 (1 minute)
  maxRequests: number; // e.g., 10 per window
  keyGenerator?: (req: Request) => string;
}

export class InMemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();

  constructor() {
    // Periodic garbage collection every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.records.entries()) {
        if (now - record.lastRefillTime > 300000) {
          this.records.delete(key);
        }
      }
    }, 300000).unref();
  }

  isAllowed(key: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    let record = this.records.get(key);

    if (!record) {
      record = { tokens: maxRequests - 1, lastRefillTime: now };
      this.records.set(key, record);
      return { allowed: true, retryAfterSeconds: 0 };
    }

    // Refill tokens proportionally
    const elapsed = now - record.lastRefillTime;
    if (elapsed >= windowMs) {
      record.tokens = maxRequests - 1;
      record.lastRefillTime = now;
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (record.tokens > 0) {
      record.tokens--;
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const retryAfterSeconds = Math.ceil((windowMs - elapsed) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  reset(key: string) {
    this.records.delete(key);
  }
}

const defaultLimiter = new InMemoryRateLimiter();

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyGenerator } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Generate key: IP address + optional route
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = keyGenerator ? keyGenerator(req) : `${ip}:${req.baseUrl || req.path}`;

    const result = defaultLimiter.isAllowed(key, maxRequests, windowMs);

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfterSeconds);
      return next(
        new RateLimitedError(
          `Too many requests. Please try again after ${result.retryAfterSeconds} seconds.`
        )
      );
    }

    next();
  };
}

/**
 * Standard auth rate limiter: 10 requests per minute per IP.
 */
export const authRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyGenerator: (req) => `auth:${req.ip || 'unknown'}:${req.body?.email || ''}`,
});

/**
 * Standard webhook rate limiter: 120 requests per minute.
 */
export const webhookRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  keyGenerator: (req) => `webhook:${req.ip || 'unknown'}:${req.params?.provider || ''}`,
});
