import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../core/database/prisma.js';
import { passwordService } from '../security/auth/password.js';
import { tokenService } from '../security/auth/tokenService.js';
import { authMiddleware } from '../security/middleware/authMiddleware.js';
import { AuthenticationRequiredError } from '../core/errors/appError.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  organizationId: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// POST /api/v1/auth/login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, organizationId } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            organization: true,
            role: true,
          },
        },
      },
    });

    // Constant-time check: don't reveal whether user exists (§6.5)
    if (!user || !user.passwordHash || !user.isActive) {
      // Fake verify to prevent timing attacks
      await passwordService.verifyPassword(
        '$argon2id$v=19$m=65536,t=3,p=4$dummyhashdummyhashdummyhash$dummyhashdummyhashdummyhash',
        password
      );
      throw new AuthenticationRequiredError('Invalid email or password');
    }

    const isValid = await passwordService.verifyPassword(user.passwordHash, password);
    if (!isValid) {
      throw new AuthenticationRequiredError('Invalid email or password');
    }

    if (user.memberships.length === 0) {
      throw new AuthenticationRequiredError('User has no active organization memberships');
    }

    // Membership Selection (§6.2)
    let selectedMembership = user.memberships[0];
    if (organizationId) {
      const match = user.memberships.find((m) => m.organizationId === organizationId);
      if (!match) {
        throw new AuthenticationRequiredError('No active membership found for specified organization');
      }
      selectedMembership = match;
    } else if (user.memberships.length > 1) {
      // If user has multiple active memberships and didn't specify one, prompt selection
      res.status(200).json({
        success: true,
        data: {
          requiresMembershipSelection: true,
          memberships: user.memberships.map((m) => ({
            membershipId: m.id,
            organizationId: m.organizationId,
            organizationName: m.organization.name,
            roleName: m.role.name,
          })),
        },
      });
      return;
    }

    if (!selectedMembership) {
      throw new AuthenticationRequiredError('Failed to resolve active membership');
    }

    // Create server-side session row (§6.3)
    const refreshTokenFamilyId = `fam_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        organizationId: selectedMembership.organizationId,
        membershipId: selectedMembership.id,
        authorizationVersion: selectedMembership.authorizationVersion,
        refreshTokenFamilyId,
        ipAddress: req.ip,
        userAgent: req.header('User-Agent'),
        expiresAt,
      },
    });

    const accessToken = tokenService.generateAccessToken({
      sessionId: session.id,
      userId: user.id,
      organizationId: selectedMembership.organizationId,
      membershipId: selectedMembership.id,
      authorizationVersion: selectedMembership.authorizationVersion,
    });

    const refreshToken = tokenService.generateRefreshToken({
      familyId: refreshTokenFamilyId,
      sessionId: session.id,
      tokenVersion: 1,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        organization: {
          id: selectedMembership.organization.id,
          name: selectedMembership.organization.name,
          slug: selectedMembership.organization.slug,
        },
        membership: {
          id: selectedMembership.id,
          role: selectedMembership.role.name,
          scope: selectedMembership.role.scope,
          jobTitle: selectedMembership.jobTitle,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = tokenService.verifyRefreshToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        membership: true,
      },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new AuthenticationRequiredError('Session is invalid or expired');
    }

    // Detect family reuse / theft (§6.3)
    if (session.refreshTokenFamilyId !== payload.familyId) {
      // Invalidate compromised session immediately
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      throw new AuthenticationRequiredError('Compromised refresh token detected. Session revoked.');
    }

    // Rotate refresh token family ID
    const newFamilyId = `fam_${crypto.randomUUID()}`;
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenFamilyId: newFamilyId,
        lastSeenAt: new Date(),
      },
    });

    const newAccessToken = tokenService.generateAccessToken({
      sessionId: session.id,
      userId: session.userId,
      organizationId: session.organizationId,
      membershipId: session.membershipId,
      authorizationVersion: session.membership.authorizationVersion,
    });

    const newRefreshToken = tokenService.generateRefreshToken({
      familyId: newFamilyId,
      sessionId: session.id,
      tokenVersion: payload.tokenVersion + 1,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
authRouter.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = (req as any).auth?.sessionId || req.header('X-Session-ID');
    if (sessionId) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
authRouter.get('/me', authMiddleware, (req: Request, res: Response) => {
  const actor = req.actor!;
  res.status(200).json({
    success: true,
    data: {
      userId: actor.userId,
      organizationId: actor.organizationId,
      membershipId: actor.membershipId,
      roleSlug: actor.roleSlug,
      scope: actor.scope,
      capabilities: Array.from(actor.capabilities),
      teamIds: actor.teamIds,
      projectIds: actor.projectIds,
      isSystemActor: actor.isSystemActor,
    },
  });
});
