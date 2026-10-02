import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ApiErrorResponse, ErrorDetail } from './appError.js';
import { asyncContext } from '../context/asyncContext.js';
import { logger } from '../logging/logger.js';
import { env } from '../../config/env.js';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = asyncContext.getCorrelationId();

  if (err instanceof AppError) {
    logger.warn({
      msg: 'Domain / Application AppError occurred',
      errorCode: err.code,
      statusCode: err.statusCode,
      target: err.target,
      details: err.details,
      errorMessage: err.message,
    });

    const responsePayload: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        target: err.target,
        details: err.details,
        correlationId,
      },
    };

    res.status(err.statusCode).json(responsePayload);
    return;
  }

  if (err instanceof ZodError) {
    const details: ErrorDetail[] = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      issue: issue.message,
      code: issue.code,
    }));

    logger.warn({
      msg: 'Transport validation failed (Zod)',
      details,
    });

    const responsePayload: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input',
        details,
        correlationId,
      },
    };

    res.status(422).json(responsePayload);
    return;
  }

  // Unhandled / Internal Server Error
  logger.error({
    msg: 'Unhandled internal server error',
    errorMessage: err.message,
    stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  const responsePayload: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred',
      correlationId,
    },
  };

  res.status(500).json(responsePayload);
}
