import { z } from 'zod';

/**
 * Variables that MUST be present (and well-formed) for a production deployment.
 * Validated at server startup via `src/instrumentation.ts` so a misconfigured
 * deployment fails immediately instead of on the first user request.
 *
 * Only variable names and validation messages are ever surfaced — never values.
 */
const requiredProductionEnvSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required'),
  CRON_SECRET: z.string().min(1, 'CRON_SECRET is required'),
  TOTP_ENCRYPTION_KEY: z.string().min(1, 'TOTP_ENCRYPTION_KEY is required'),
  ADMIN_JWT_SECRET: z.string().min(1, 'ADMIN_JWT_SECRET is required'),
  // Staff auth rate limiting fails closed in production (see staff-auth-rate-limit.ts): without a
  // Redis backend, every staff sign-in returns 503 and the admin is locked out. Require it at deploy.
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),
});

/** Dev/test escape hatches that must never be active in production. */
const FORBIDDEN_TRUTHY_FLAGS = [
  'AUTH_DEV_PHONE_BYPASS_ENABLED',
  'AUTH_DEV_2FA_BYPASS_ENABLED',
] as const;

/** Variables whose mere presence exposes destructive/test-only surfaces in production. */
const FORBIDDEN_PRESENT_VARS = ['E2E_TEST_SECRET', 'ALLOW_SEED', 'CONFIRM_SEED'] as const;

type EnvRecord = Record<string, string | undefined>;

function isProductionRuntime(env: EnvRecord): boolean {
  // Gate on the deployment marker, not NODE_ENV: Vercel sets VERCEL_ENV=production only for
  // real production deploys (preview builds are 'preview'), and the e2e server runs with
  // NODE_ENV=production but no VERCEL_ENV — so it must not trip this validation.
  return env.VERCEL_ENV === 'production' || env.APP_ENV === 'production';
}

function isTruthyFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
}

/**
 * Validates production environment configuration. No-op outside production.
 * Throws a single aggregated error (names + messages only) when configuration
 * is missing or unsafe, so the failure surfaces at deploy/boot time.
 */
export function validateProductionEnv(env: EnvRecord = process.env): void {
  if (!isProductionRuntime(env)) {
    return;
  }

  const errors: string[] = [];

  const parsed = requiredProductionEnvSchema.safeParse(env);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const name = issue.path.join('.');
      // zod emits a generic "Required" for missing keys; prefix the variable name so operators know what to set.
      errors.push(name ? `- ${name}: ${issue.message}` : `- ${issue.message}`);
    }
  }

  for (const flag of FORBIDDEN_TRUTHY_FLAGS) {
    if (isTruthyFlag(env[flag])) {
      errors.push(`- ${flag} must not be enabled in production`);
    }
  }

  for (const key of FORBIDDEN_PRESENT_VARS) {
    if ((env[key]?.trim() ?? '') !== '') {
      errors.push(`- ${key} must not be set in production`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid production environment configuration:\n${errors.join('\n')}\n` +
        'See docs/ENVIRONMENT.md for the required variables.',
    );
  }
}
