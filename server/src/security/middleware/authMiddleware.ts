import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../auth/tokenService.js';
import { prisma } from '../../core/database/prisma.js';
import { asyncContext } from '../../core/context/asyncContext.js';
import { ActorContext } from '../context/actorContext.js';
import {
  AuthenticationRequiredError,
  ForbiddenError,
} from '../../core/errors/appError.js';

// Extend Express Request with actor context
declare global {
  namespace Express {
    interface Request {
      actor?: ActorContext;
    }
  }
}

/**
 * Authentication Middleware:
 * Resolves session, validates authorizationVersion, builds immutable ActorContext (§6.2, §6.6, §7.1).
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationRequiredError('Missing or invalid Authorization header'));
  }

  const token = authHeader.substring(7);

  try {
    const payload = tokenService.verifyAccessToken(token);

    // Load active session and membership from database
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        membership: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
            teamMemberships: {
              where: { isActive: true },
              select: { teamId: true },
            },
            userProjects: {
              select: { projectId: true },
            },
          },
        },
      },
    });

    if (!session) {
      return next(new AuthenticationRequiredError('Session not found'));
    }

    if (session.revokedAt) {
      return next(new AuthenticationRequiredError('Session has been revoked'));
    }

    if (session.expiresAt <= new Date()) {
      return next(new AuthenticationRequiredError('Session has expired'));
    }

    const { membership } = session;

    if (membership.status !== 'ACTIVE') {
      return next(new AuthenticationRequiredError('Organization membership is not active'));
    }

    // Invariant §6.6: authorizationVersion mismatch forces immediate re-issue or rejection
    if (session.authorizationVersion !== membership.authorizationVersion) {
      return next(
        new AuthenticationRequiredError(
          'Permissions have changed. Re-authentication required (TOKEN_STALE)'
        )
      );
    }

    // Extract capabilities
    const capabilities = new Set<string>();
    for (const rp of membership.role.permissions) {
      capabilities.add(rp.permission.key);
    }

    // Extract team IDs and project IDs
    const teamIds = membership.teamMemberships.map((tm) => tm.teamId);
    const projectIds = membership.userProjects.map((up) => up.projectId);

    const actor: ActorContext = {
      userId: session.userId,
      organizationId: session.organizationId,
      membershipId: membership.id,
      roleId: membership.roleId,
      roleSlug: membership.role.slug,
      capabilities,
      scope: membership.role.scope,
      teamIds,
      projectIds,
      isSystemActor: membership.role.isSystem,
      authorizationVersion: membership.authorizationVersion,
      correlationId: asyncContext.getCorrelationId(),
    };

    req.actor = actor;

    // Tenancy parameter scrubbing invariant (§5.8)
    // Any endpoint that accepts organizationId as request input is an architectural defect.
    if (req.query && 'organizationId' in req.query) {
      delete (req.query as any).organizationId;
    }
    if (req.body && typeof req.body === 'object' && 'organizationId' in req.body) {
      delete req.body.organizationId;
    }
    if (req.params && 'organizationId' in req.params) {
      delete (req.params as any).organizationId;
    }

    // Update async context
    asyncContext.set({
      organizationId: actor.organizationId,
      userId: actor.userId,
      membershipId: actor.membershipId,
      sessionId: session.id,
      actorType: actor.isSystemActor ? 'SYSTEM' : 'USER',
    });

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Capability Guard Middleware:
 * Verifies that the authenticated actor holds the specified capability (§7.1, §7.3).
 */
export function requireCapability(requiredCapability: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.actor) {
      return next(new AuthenticationRequiredError('Authentication required'));
    }

    const { capabilities, isSystemActor } = req.actor;

    if (isSystemActor || capabilities.has('*') || capabilities.has(requiredCapability)) {
      return next();
    }

    return next(
      new ForbiddenError(`Actor lacks required capability: ${requiredCapability}`)
    );
  };
}
