import { describe, it, expect } from 'vitest';
import { targetValidator } from '../../src/security/authorization/targetValidator.js';
import { TenantMismatchError, ResourceNotFoundError, ValidationError } from '../../src/core/errors/appError.js';

describe('INV-TEN: Tenant Isolation Invariant Suite (§5.6, §7.5)', () => {
  const orgA = 'org_alpha_111';
  const orgB = 'org_beta_222';

  describe('INV-TEN-001 & INV-TEN-005: Cross-Tenant Reference Protection Logic', () => {
    it('rejects cross-tenant customer validation when customer belongs to another tenant', async () => {
      // Mock client returning customer belonging to orgB
      const mockClient: any = {
        customer: {
          findUnique: async () => ({
            id: 'cust_b',
            organizationId: orgB,
            deletedAt: null,
          }),
        },
      };

      // Actor in orgA attempts to validate customer in orgB
      await expect(
        targetValidator.validateCustomer('cust_b', orgA, mockClient)
      ).rejects.toThrowError(TenantMismatchError);
    });

    it('rejects cross-tenant lead validation when lead belongs to another tenant', async () => {
      const mockClient: any = {
        lead: {
          findUnique: async () => ({
            id: 'lead_b',
            organizationId: orgB,
            deletedAt: null,
          }),
        },
      };

      await expect(
        targetValidator.validateLead('lead_b', orgA, mockClient)
      ).rejects.toThrowError(TenantMismatchError);
    });

    it('rejects cross-tenant property unit validation when unit belongs to another tenant', async () => {
      const mockClient: any = {
        propertyUnit: {
          findUnique: async () => ({
            id: 'unit_b',
            organizationId: orgB,
            availability: 'AVAILABLE',
            projectId: 'proj_b',
          }),
        },
      };

      await expect(
        targetValidator.validatePropertyUnit('unit_b', orgA, mockClient)
      ).rejects.toThrowError(TenantMismatchError);
    });

    it('rejects cross-tenant assignee validation when user has no active membership in target organization', async () => {
      const mockClient: any = {
        organizationMembership: {
          findFirst: async () => null, // no active membership found in orgA
        },
      };

      await expect(
        targetValidator.validateAssignee('user_b', orgA, mockClient)
      ).rejects.toThrowError(ValidationError);
    });

    it('passes validation when entity belongs strictly to the authenticated organization', async () => {
      const mockClient: any = {
        customer: {
          findUnique: async () => ({
            id: 'cust_a',
            organizationId: orgA,
            deletedAt: null,
          }),
        },
      };

      const validCustomer = await targetValidator.validateCustomer('cust_a', orgA, mockClient);
      expect(validCustomer.organizationId).toBe(orgA);
    });
  });
});
