import { describe, it, expect } from 'vitest';
import { ScopeType } from '@prisma/client';
import { validateRoleDualMode } from '../../src/domain/role/roleValidator.js';
import { ValidationError } from '../../src/core/errors/appError.js';

describe('INV-ROL: Dual-Mode Role Invariant Suite (§6.1, §6.2, §7.8)', () => {
  describe('INV-ROL-001: Tenant Role Structural Integrity', () => {
    it('should reject a role with organizationId set and isSystem = true', () => {
      expect(() => {
        validateRoleDualMode({
          name: 'Invalid System Role',
          slug: 'invalid_sys',
          scope: ScopeType.GLOBAL,
          isSystem: true,
          organizationId: 'org_123',
        });
      }).toThrowError(ValidationError);

      try {
        validateRoleDualMode({
          name: 'Invalid System Role',
          slug: 'invalid_sys',
          scope: ScopeType.GLOBAL,
          isSystem: true,
          organizationId: 'org_123',
        });
      } catch (err: any) {
        expect(err.target).toBe('organizationId');
        expect(err.message).toContain('organizationId must be NULL');
      }
    });

    it('should allow valid tenant role with organizationId and isSystem = false', () => {
      expect(() => {
        validateRoleDualMode({
          name: 'Sales Manager',
          slug: 'sales_mgr',
          scope: ScopeType.TEAM,
          isSystem: false,
          organizationId: 'org_123',
        });
      }).not.toThrow();
    });

    it('should reject a tenant role without organizationId', () => {
      expect(() => {
        validateRoleDualMode({
          name: 'Orphan Tenant Role',
          slug: 'orphan_role',
          scope: ScopeType.SELF,
          isSystem: false,
          organizationId: null,
        });
      }).toThrowError(ValidationError);
    });

    it('should reject a tenant role attempting to claim GLOBAL scope', () => {
      expect(() => {
        validateRoleDualMode({
          name: 'Sneaky Tenant Role',
          slug: 'sneaky_role',
          scope: ScopeType.GLOBAL,
          isSystem: false,
          organizationId: 'org_123',
        });
      }).toThrowError(ValidationError);
    });
  });

  describe('INV-ROL-002: Platform System Role Integrity', () => {
    it('should reject a platform system role with non-GLOBAL scope', () => {
      expect(() => {
        validateRoleDualMode({
          name: 'Sub-scoped System Admin',
          slug: 'sub_sys_admin',
          scope: ScopeType.TEAM,
          isSystem: true,
          organizationId: null,
        });
      }).toThrowError(ValidationError);

      try {
        validateRoleDualMode({
          name: 'Sub-scoped System Admin',
          slug: 'sub_sys_admin',
          scope: ScopeType.TEAM,
          isSystem: true,
          organizationId: null,
        });
      } catch (err: any) {
        expect(err.target).toBe('scope');
        expect(err.message).toContain('scope = GLOBAL');
      }
    });

    it('should allow a valid platform system role with organizationId = null and scope = GLOBAL', () => {
      expect(() => {
        validateRoleDualMode({
          name: 'Platform Super Administrator',
          slug: 'platform_super_admin',
          scope: ScopeType.GLOBAL,
          isSystem: true,
          organizationId: null,
        });
      }).not.toThrow();
    });
  });
});
