import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { asyncContext } from '../../src/core/context/asyncContext.js';
import {
  ValidationError,
  ForbiddenError,
  OutsideScopeError,
  ResourceNotFoundError,
  ConflictError,
  AuthenticationRequiredError,
  TenantMismatchError,
} from '../../src/core/errors/appError.js';

describe('Phase 0 Foundation Primitives', () => {
  const app = createApp();

  describe('Correlation ID Middleware', () => {
    it('should generate a correlation ID if none is supplied', async () => {
      const res = await request(app).get('/health/liveness');
      expect(res.status).toBe(200);
      expect(res.headers['x-correlation-id']).toBeDefined();
      expect(res.headers['x-correlation-id']).toMatch(/^corr_/);
    });

    it('should propagate a supplied X-Correlation-ID header', async () => {
      const customId = 'test-client-corr-id-999';
      const res = await request(app)
        .get('/health/liveness')
        .set('X-Correlation-ID', customId);

      expect(res.status).toBe(200);
      expect(res.headers['x-correlation-id']).toBe(customId);
    });
  });

  describe('Standardized API Error Contract (§27.4)', () => {
    it('should return 404 RESOURCE_NOT_FOUND for unknown routes', async () => {
      const res = await request(app).get('/api/v1/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Endpoint not found',
          correlationId: expect.any(String),
        },
      });
    });

    it('should surface TenantMismatchError as 404 RESOURCE_NOT_FOUND (§7.9)', () => {
      const err = new TenantMismatchError('Record does not exist');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should verify error codes and status codes of domain errors', () => {
      expect(new AuthenticationRequiredError('Auth needed').statusCode).toBe(401);
      expect(new ForbiddenError('No capability').statusCode).toBe(403);
      expect(new OutsideScopeError('Outside scope').statusCode).toBe(403);
      expect(new ResourceNotFoundError('Not found').statusCode).toBe(404);
      expect(new ConflictError('State conflict').statusCode).toBe(409);
      expect(new ValidationError('Invalid', 'field').statusCode).toBe(422);
    });
  });

  describe('AsyncLocalStorage Context', () => {
    it('should preserve correlationId across async execution contexts', async () => {
      await asyncContext.run(
        { correlationId: 'async-corr-123', requestId: 'req-123', organizationId: 'org-test' },
        async () => {
          expect(asyncContext.getCorrelationId()).toBe('async-corr-123');
          expect(asyncContext.getOrganizationId()).toBe('org-test');

          // Nested async boundary
          await new Promise((resolve) => setTimeout(resolve, 10));
          expect(asyncContext.getCorrelationId()).toBe('async-corr-123');
        }
      );
    });
  });
});
