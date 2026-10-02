import { PrismaClient } from '@prisma/client';
import { logger } from '../logging/logger.js';
import { env } from '../../config/env.js';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

if (env.NODE_ENV === 'development') {
  // @ts-ignore
  prisma.$on('query', (e: any) => {
    logger.debug({
      msg: 'Prisma Query Executed',
      query: e.query,
      durationMs: e.duration,
      params: e.params,
    });
  });
}

// @ts-ignore
prisma.$on('error', (e: any) => {
  logger.error({
    msg: 'Prisma Database Error',
    target: e.target,
    message: e.message,
  });
});

if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
