import { ScopeType } from '@prisma/client';
import { ValidationError } from '../../core/errors/appError.js';

export interface CreateRoleInput {
  name: string;
  slug: string;
  scope: ScopeType;
  isSystem?: boolean;
  organizationId?: string | null;
  description?: string;
}

/**
 * Validates the Dual-Mode Role Invariant (§5.3, §7.8):
 * - Tenant Role: organizationId IS NOT NULL AND isSystem = FALSE AND scope != GLOBAL
 * - Platform System Role: organizationId IS NULL AND isSystem = TRUE AND scope = GLOBAL
 */
export function validateRoleDualMode(input: CreateRoleInput): void {
  const isSystem = Boolean(input.isSystem);

  if (isSystem) {
    if (input.organizationId !== null && input.organizationId !== undefined) {
      throw new ValidationError(
        'Platform system roles must not be bound to an organization (organizationId must be NULL)',
        'organizationId'
      );
    }
    if (input.scope !== ScopeType.GLOBAL) {
      throw new ValidationError(
        'Platform system roles must strictly have scope = GLOBAL',
        'scope'
      );
    }
  } else {
    if (!input.organizationId) {
      throw new ValidationError(
        'Tenant roles must be explicitly bound to an organization (organizationId is required)',
        'organizationId'
      );
    }
    if (input.scope === ScopeType.GLOBAL) {
      throw new ValidationError(
        'Tenant roles cannot hold GLOBAL scope',
        'scope'
      );
    }
  }
}
