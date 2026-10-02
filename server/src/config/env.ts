import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('/api/v1'),

  // Neon PostgreSQL connection strings
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection URL'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid direct connection URL'),

  // Redis Cache & Queue
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection URL').default('redis://localhost:6379'),

  // Security & Authentication Tokens (DEC-001)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long for security baseline'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),

  // Argon2id Hashing Parameters (DEC-003)
  ARGON2_MEMORY_COST: z.coerce.number().default(65536),
  ARGON2_TIME_COST: z.coerce.number().default(3),
  ARGON2_PARALLELISM: z.coerce.number().default(4),

  // Rate Limiting (DEC-010)
  RATE_LIMIT_AUTH_PER_MIN: z.coerce.number().default(10),
  RATE_LIMIT_WEBHOOK_PER_MIN: z.coerce.number().default(60),
  RATE_LIMIT_API_PER_MIN: z.coerce.number().default(600),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Telephony Configuration (Provider-Neutral Abstraction)
  TELEPHONY_PROVIDER: z.enum(['mock', 'knowlarity']).default('mock'),
  KNOWLARITY_BASE_URL: z.string().url().default('https://sr.knowlarity.com/newsr/api/v1/click2call/'),
  KNOWLARITY_API_KEY: z.string().optional().default(''),
  KNOWLARITY_AUTH_TOKEN: z.string().optional().default(''),
  KNOWLARITY_K_NUMBER: z.string().optional().default('+918047100000'),
  KNOWLARITY_CALLER_ID: z.string().optional().default('+918047100000'),

  // Meta Lead Ads Integration (§21.2)
  META_VERIFY_TOKEN: z.string().default('ralix_meta_verify_token_2026'),
  META_APP_SECRET: z.string().optional().default(''),
  META_PAGE_ACCESS_TOKEN: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env;

try {
  parsedEnv = envSchema.parse(process.cwd() ? process.env : {});
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Configuration Validation Failed. Missing or invalid environment variables:');
    for (const issue of error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
  } else {
    console.error('❌ Unknown error during configuration validation:', error);
  }
  process.exit(1);
}

export const env = parsedEnv;
