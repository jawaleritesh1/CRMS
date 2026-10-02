import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AuthenticationRequiredError } from '../../core/errors/appError.js';

export interface AccessTokenPayload {
  sessionId: string;
  userId: string;
  organizationId: string;
  membershipId: string;
  authorizationVersion: number;
}

export interface RefreshTokenPayload {
  familyId: string;
  sessionId: string;
  tokenVersion: number;
}

export const tokenService = {
  /**
   * Generates a short-lived access token with session and authorization claims (§6.3, DEC-001).
   */
  generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
    });
  },

  /**
   * Generates a rotating single-use refresh token bound to a token family.
   */
  generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions['expiresIn'],
    });
  },

  /**
   * Verifies and decodes an access token.
   */
  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationRequiredError('Access token has expired');
      }
      throw new AuthenticationRequiredError('Invalid access token');
    }
  },

  /**
   * Verifies and decodes a refresh token.
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as RefreshTokenPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationRequiredError('Refresh token has expired');
      }
      throw new AuthenticationRequiredError('Invalid refresh token');
    }
  },
};
