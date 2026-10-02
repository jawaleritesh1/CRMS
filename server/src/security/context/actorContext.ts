import { ScopeType } from '@prisma/client';

export interface ActorContext {
  userId: string;
  organizationId: string;
  membershipId: string;
  roleId: string;
  roleSlug: string;
  capabilities: Set<string>;
  scope: ScopeType;
  teamIds: string[];
  projectIds: string[];
  isSystemActor: boolean;
  authorizationVersion: number;
  correlationId: string;
}

/**
 * Creates a synthetic SystemActorContext for background workers and schedulers (§5.9).
 */
export function createSystemActorContext(params: {
  organizationId: string;
  correlationId: string;
  actorIdentifier?: string;
}): ActorContext {
  return {
    userId: params.actorIdentifier ?? 'system:worker',
    organizationId: params.organizationId,
    membershipId: 'system:membership',
    roleId: 'system:role',
    roleSlug: 'platform_system',
    capabilities: new Set(['*']), // System actors have global capability within target organization
    scope: ScopeType.ORGANIZATION,
    teamIds: [],
    projectIds: [],
    isSystemActor: true,
    authorizationVersion: 1,
    correlationId: params.correlationId,
  };
}
