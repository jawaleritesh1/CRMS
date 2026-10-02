export type ErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'FORBIDDEN'
  | 'OUTSIDE_SCOPE'
  | 'TENANT_MISMATCH'
  | 'RESOURCE_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'EXTERNAL_PROVIDER_ERROR'
  | 'INTERNAL_ERROR';

export interface ErrorDetail {
  field?: string;
  issue: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    target?: string;
    details?: ErrorDetail[];
    correlationId: string;
  };
}

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: ErrorCode;
  readonly target?: string;
  readonly details?: ErrorDetail[];

  constructor(message: string, target?: string, details?: ErrorDetail[]) {
    super(message);
    this.name = this.constructor.name;
    this.target = target;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationRequiredError extends AppError {
  readonly statusCode = 401;
  readonly code = 'AUTHENTICATION_REQUIRED' as const;
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN' as const;
}

export class OutsideScopeError extends AppError {
  readonly statusCode = 403;
  readonly code = 'OUTSIDE_SCOPE' as const;
}

export class TenantMismatchError extends AppError {
  // Surfaced as 404 RESOURCE_NOT_FOUND to clients to prevent tenant enumeration (§7.9, §27.4)
  readonly statusCode = 404;
  readonly code = 'RESOURCE_NOT_FOUND' as const;

  constructor(message = 'Resource not found', target?: string) {
    super(message, target);
  }
}

export class ResourceNotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'RESOURCE_NOT_FOUND' as const;
}

export class ValidationError extends AppError {
  readonly statusCode = 422;
  readonly code = 'VALIDATION_ERROR' as const;
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT' as const;
}

export class RateLimitedError extends AppError {
  readonly statusCode = 429;
  readonly code = 'RATE_LIMITED' as const;
}

export class ExternalProviderError extends AppError {
  readonly statusCode = 502;
  readonly code = 'EXTERNAL_PROVIDER_ERROR' as const;
}

export class InternalError extends AppError {
  readonly statusCode = 500;
  readonly code = 'INTERNAL_ERROR' as const;
}
