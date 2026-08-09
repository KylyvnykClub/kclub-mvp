import { describe, expect, test } from 'vitest';

import { validateProductionEnv } from '@/server/env-validation';

const VALID_PRODUCTION_ENV: Record<string, string | undefined> = {
  VERCEL_ENV: 'production',
  DATABASE_URL: 'postgres://user:pass@db.example.com:6543/postgres',
  NEXT_PUBLIC_APP_URL: 'https://app.example.com',
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  STRIPE_SECRET_KEY: 'sk_live_x',
  STRIPE_WEBHOOK_SECRET: 'whsec_x',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_live_x',
  CRON_SECRET: 'cron-secret',
  TOTP_ENCRYPTION_KEY: 'totp-key',
  ADMIN_JWT_SECRET: 'admin-jwt-secret',
  UPSTASH_REDIS_REST_URL: 'https://redis.example.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'upstash-token',
};

describe('validateProductionEnv', () => {
  test('is a no-op outside production', () => {
    expect(() => validateProductionEnv({ NODE_ENV: 'development' })).not.toThrow();
    expect(() => validateProductionEnv({ NODE_ENV: 'test' })).not.toThrow();
  });

  test('is a no-op when NODE_ENV=production but not a real deploy (e.g. e2e server)', () => {
    // The e2e server runs next start (NODE_ENV=production) with E2E_TEST_SECRET and no
    // VERCEL_ENV; validation must not fire there.
    expect(() =>
      validateProductionEnv({ NODE_ENV: 'production', E2E_TEST_SECRET: 'e2e' }),
    ).not.toThrow();
  });

  test('fires on APP_ENV=production as well as VERCEL_ENV', () => {
    expect(() => validateProductionEnv({ APP_ENV: 'production' })).toThrow(
      /Invalid production environment configuration/,
    );
  });

  test('passes when all required production variables are present and well-formed', () => {
    expect(() => validateProductionEnv({ ...VALID_PRODUCTION_ENV })).not.toThrow();
  });

  test('throws listing every missing required variable', () => {
    expect(() => validateProductionEnv({ VERCEL_ENV: 'production' })).toThrow(
      /Invalid production environment configuration/,
    );
    try {
      validateProductionEnv({ VERCEL_ENV: 'production' });
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('DATABASE_URL');
      expect(message).toContain('CRON_SECRET');
      expect(message).toContain('TOTP_ENCRYPTION_KEY');
      expect(message).toContain('UPSTASH_REDIS_REST_URL');
      expect(message).toContain('UPSTASH_REDIS_REST_TOKEN');
    }
  });

  test('rejects malformed URLs', () => {
    expect(() =>
      validateProductionEnv({ ...VALID_PRODUCTION_ENV, NEXT_PUBLIC_APP_URL: 'not-a-url' }),
    ).toThrow(/NEXT_PUBLIC_APP_URL/);
  });

  test('rejects dev bypass flags enabled in production', () => {
    expect(() =>
      validateProductionEnv({ ...VALID_PRODUCTION_ENV, AUTH_DEV_PHONE_BYPASS_ENABLED: 'true' }),
    ).toThrow(/AUTH_DEV_PHONE_BYPASS_ENABLED must not be enabled/);
    expect(() =>
      validateProductionEnv({ ...VALID_PRODUCTION_ENV, AUTH_DEV_2FA_BYPASS_ENABLED: '1' }),
    ).toThrow(/AUTH_DEV_2FA_BYPASS_ENABLED must not be enabled/);
  });

  test('rejects test/seed variables present in production', () => {
    expect(() => validateProductionEnv({ ...VALID_PRODUCTION_ENV, E2E_TEST_SECRET: 'x' })).toThrow(
      /E2E_TEST_SECRET must not be set/,
    );
    expect(() => validateProductionEnv({ ...VALID_PRODUCTION_ENV, ALLOW_SEED: 'true' })).toThrow(
      /ALLOW_SEED must not be set/,
    );
  });
});
