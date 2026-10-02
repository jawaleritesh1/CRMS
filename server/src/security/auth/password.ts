import { hash, verify } from '@node-rs/argon2';
import { env } from '../../config/env.js';

const ARGON2_OPTIONS = {
  memoryCost: env.ARGON2_MEMORY_COST,
  timeCost: env.ARGON2_TIME_COST,
  parallelism: env.ARGON2_PARALLELISM,
  outputLen: 32,
};

export const passwordService = {
  /**
   * Hashes a plaintext password using Argon2id with calibrated parameters (DEC-003).
   */
  async hashPassword(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
  },

  /**
   * Verifies a candidate password against an Argon2id hash in constant time.
   */
  async verifyPassword(hashString: string, candidate: string): Promise<boolean> {
    try {
      return await verify(hashString, candidate);
    } catch {
      return false;
    }
  },
};
