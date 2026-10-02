import pino from 'pino';
import { asyncContext } from '../context/asyncContext.js';
import { env } from '../../config/env.js';

const isProduction = env.NODE_ENV === 'production';

// Sensitive keys to strictly redact from all log outputs (§31.2, §37.1)
const REDACT_PATHS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'jwt',
  'authorization',
  'cookie',
  'phone',
  'email',
  'customerPhone',
  'customerEmail',
  'normalizedPhone',
  'normalizedEmail',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.phone',
  '*.email',
  'req.headers.authorization',
  'req.headers.cookie',
];

const baseLogger = pino({
  level: isProduction ? 'info' : 'debug',
  redact: {
    paths: REDACT_PATHS,
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
});

export const logger = new Proxy(baseLogger, {
  get(target, prop, receiver) {
    const origMethod = Reflect.get(target, prop, receiver);
    if (typeof origMethod === 'function' && ['info', 'error', 'warn', 'debug', 'trace', 'fatal'].includes(prop as string)) {
      return (...args: any[]) => {
        const ctx = asyncContext.get();
        if (ctx) {
          const contextData = {
            correlationId: ctx.correlationId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            requestId: ctx.requestId,
          };
          if (typeof args[0] === 'object' && args[0] !== null) {
            args[0] = { ...contextData, ...args[0] };
          } else {
            args.unshift(contextData);
          }
        }
        return (origMethod as Function).apply(target, args);
      };
    }
    return origMethod;
  },
});
