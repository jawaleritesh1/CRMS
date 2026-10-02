import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { passwordService } from '../../src/security/auth/password.js';
import { tokenService } from '../../src/security/auth/tokenService.js';
import { piiMasker } from '../../src/security/pii/piiMasker.js';
import { scopeFilter } from '../../src/security/authorization/scopeFilter.js';
import { ScopeType } from '@prisma/client';
import { ActorContext } from '../../src/security/context/actorContext.js';
import { requireCapability } from '../../src/security/middleware/authMiddleware.js';
import { ForbiddenError } from '../../src/core/errors/appError.js';

describe('Phase 2: Authentication, Authorization & Security Primitives', () => {
  describe('Password Hashing (Argon2id §6.3, DEC-003)', () => {
    it('should hash a password and verify it correctly', async () => {
      const rawPassword = 'StrongPassword!2026';
      const hashed = await passwordService.hashPassword(rawPassword);

      expect(hashed).toBeDefined();
      expect(hashed).toContain('$argon2id$');

      const matches = await passwordService.verifyPassword(hashed, rawPassword);
      expect(matches).toBe(true);

      const wrongMatches = await passwordService.verifyPassword(hashed, 'WrongPassword');
      expect(wrongMatches).toBe(false);
    });
  });

  describe('Token Lifecycles (§6.3, DEC-001)', () => {
    it('should generate and verify access tokens carrying actor claims', () => {
      const payload = {
        sessionId: 'sess_123',
        userId: 'usr_456',
        organizationId: 'org_789',
        membershipId: 'mem_101',
        authorizationVersion: 2,
      };

      const token = tokenService.generateAccessToken(payload);
      expect(token).toBeDefined();

      const decoded = tokenService.verifyAccessToken(token);
      expect(decoded.sessionId).toBe(payload.sessionId);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.organizationId).toBe(payload.organizationId);
      expect(decoded.membershipId).toBe(payload.membershipId);
      expect(decoded.authorizationVersion).toBe(payload.authorizationVersion);
    });
  });

  describe('PII Masking & Precedence Rule (§31.2, §31.4)', () => {
    const baseActor: ActorContext = {
      userId: 'usr_1',
      organizationId: 'org_1',
      membershipId: 'mem_1',
      roleId: 'role_1',
      roleSlug: 'cse',
      capabilities: new Set(['LEAD_VIEW']),
      scope: ScopeType.SELF,
      teamIds: [],
      projectIds: [],
      isSystemActor: false,
      authorizationVersion: 1,
      correlationId: 'corr_1',
    };

    it('should mask phone number and email for actors without unmasked capability', () => {
      const customer = {
        name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        email: 'rahul.sharma@example.com',
      };

      const projected = piiMasker.projectCustomer(customer, baseActor, true);
      expect(projected.phone).toContain('*****');
      expect(projected.phone).not.toBe(customer.phone);
      expect(projected.email).toBe('r***@example.com');
    });

    it('should reveal unmasked PII only when actor holds CUSTOMER_VIEW_UNMASKED and org policy permits', () => {
      const privilegedActor: ActorContext = {
        ...baseActor,
        capabilities: new Set(['LEAD_VIEW', 'CUSTOMER_VIEW_UNMASKED']),
      };

      const customer = {
        name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        email: 'rahul.sharma@example.com',
      };

      const projected = piiMasker.projectCustomer(customer, privilegedActor, true);
      expect(projected.phone).toBe('+91 98765 43210');
      expect(projected.email).toBe('rahul.sharma@example.com');
    });
  });

  describe('Scope Filter Synthesis (§7.4, §7.6)', () => {
    it('should synthesize SELF scope targeting assignedToId', () => {
      const selfActor: ActorContext = {
        userId: 'usr_1',
        organizationId: 'org_1',
        membershipId: 'mem_1',
        roleId: 'role_1',
        roleSlug: 'cse',
        capabilities: new Set(['LEAD_VIEW']),
        scope: ScopeType.SELF,
        teamIds: [],
        projectIds: [],
        isSystemActor: false,
        authorizationVersion: 1,
        correlationId: 'corr_1',
      };

      const filter = scopeFilter.forLead(selfActor);
      expect(filter).toEqual({ assignedToId: 'mem_1' });

      const composed = scopeFilter.composeWhere(selfActor, filter, { status: 'ACTIVE' });
      expect(composed.AND).toContainEqual({ organizationId: 'org_1' });
      expect(composed.AND).toContainEqual({ assignedToId: 'mem_1' });
      expect(composed.AND).toContainEqual({ status: 'ACTIVE' });
    });

    it('should synthesize TEAM scope targeting union of assignedToId and teamIds', () => {
      const teamActor: ActorContext = {
        userId: 'usr_2',
        organizationId: 'org_1',
        membershipId: 'mem_2',
        roleId: 'role_2',
        roleSlug: 'sales_mgr',
        capabilities: new Set(['LEAD_VIEW']),
        scope: ScopeType.TEAM,
        teamIds: ['team_alpha', 'team_beta'],
        projectIds: [],
        isSystemActor: false,
        authorizationVersion: 1,
        correlationId: 'corr_2',
      };

      const filter = scopeFilter.forLead(teamActor);
      expect(filter).toEqual({
        OR: [{ assignedToId: 'mem_2' }, { teamId: { in: ['team_alpha', 'team_beta'] } }],
      });
    });
  });

  describe('Capability Guard Middleware (§7.1)', () => {
    it('should reject actors lacking the required capability', () => {
      const guard = requireCapability('LEAD_ASSIGN');
      const req: any = {
        actor: {
          capabilities: new Set(['LEAD_VIEW']),
          isSystemActor: false,
        },
      };
      const res: any = {};
      const next = vi.fn();

      guard(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should pass actors possessing the required capability', () => {
      const guard = requireCapability('LEAD_ASSIGN');
      const req: any = {
        actor: {
          capabilities: new Set(['LEAD_VIEW', 'LEAD_ASSIGN']),
          isSystemActor: false,
        },
      };
      const res: any = {};
      const next = vi.fn();

      guard(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });
  });
});
