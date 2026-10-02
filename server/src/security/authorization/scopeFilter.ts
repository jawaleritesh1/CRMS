import { ScopeType } from '@prisma/client';
import { ActorContext } from '../context/actorContext.js';

export const scopeFilter = {
  /**
   * Synthesizes the scope filter for Lead queries based on actor's scope and assignments (§7.4).
   */
  forLead(actor: ActorContext): Record<string, any> {
    if (actor.isSystemActor || actor.scope === ScopeType.GLOBAL) {
      return {};
    }

    switch (actor.scope) {
      case ScopeType.SELF:
        return {
          assignedToId: actor.membershipId,
        };

      case ScopeType.TEAM:
        if (actor.teamIds.length === 0) {
          // If user has TEAM scope but belongs to no active teams, they only see their own assigned
          return { assignedToId: actor.membershipId };
        }
        return {
          OR: [
            { assignedToId: actor.membershipId },
            { teamId: { in: actor.teamIds } },
          ],
        };

      case ScopeType.PROJECT:
        if (actor.projectIds.length === 0) {
          return { assignedToId: actor.membershipId };
        }
        return {
          OR: [
            { assignedToId: actor.membershipId },
            { projectId: { in: actor.projectIds } },
          ],
        };

      case ScopeType.ORGANIZATION:
        // Organization scope sees all records within the organization
        return {};

      default:
        return { assignedToId: actor.membershipId };
    }
  },

  /**
   * Synthesizes full tenant + scope query filter (§7.6).
   * Composition rule: ALWAYS composes with AND.
   * A user filter can only ever narrow results, never widen them.
   */
  composeWhere(
    actor: ActorContext,
    scopeWhere: Record<string, any>,
    userFilters: Record<string, any> = {}
  ): Record<string, any> {
    const filters: Record<string, any>[] = [
      { organizationId: actor.organizationId },
    ];

    if (Object.keys(scopeWhere).length > 0) {
      filters.push(scopeWhere);
    }

    if (Object.keys(userFilters).length > 0) {
      filters.push(userFilters);
    }

    return {
      AND: filters,
    };
  },
};
