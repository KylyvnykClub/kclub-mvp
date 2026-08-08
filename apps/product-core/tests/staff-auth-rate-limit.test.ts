import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import {
  __resetStaffAuthRateLimitersForTests,
  __setStaffAuthRateLimiterForTests,
  buildActorRateLimitIdentifier,
  buildPhoneRateLimitIdentifier,
  checkStaffAuthRateLimit,
} from '../src/server/staff-auth-rate-limit';

describe('staff auth rate limit helper', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalRequired = process.env.STAFF_AUTH_RATE_LIMIT_REQUIRED;
  const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    __resetStaffAuthRateLimitersForTests();
    delete process.env.STAFF_AUTH_RATE_LIMIT_REQUIRED;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    __resetStaffAuthRateLimitersForTests();
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    process.env.STAFF_AUTH_RATE_LIMIT_REQUIRED = originalRequired;
    process.env.UPSTASH_REDIS_REST_URL = originalRedisUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalRedisToken;
  });

  test('returns 429 with retry headers when the limiter rejects', async () => {
    __setStaffAuthRateLimiterForTests('password-sign-in', {
      limit: async () => ({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 4_000,
      }),
    });

    const response = await checkStaffAuthRateLimit(
      'password-sign-in',
      buildPhoneRateLimitIdentifier('+1 (555) 123-4567', '127.0.0.1'),
    );
    const payload = await response?.json();

    expect(response?.status).toBe(429);
    expect(payload?.error.code).toBe('RATE_LIMITED');
    expect(response?.headers.get('Retry-After')).toBeTruthy();
    expect(response?.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response?.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  test('returns 503 when strict enforcement is enabled without Redis config', async () => {
    process.env.STAFF_AUTH_RATE_LIMIT_REQUIRED = 'true';

    const response = await checkStaffAuthRateLimit(
      'totp-verify',
      buildActorRateLimitIdentifier('staff-1', '127.0.0.1'),
    );
    const payload = await response?.json();

    expect(response?.status).toBe(503);
    expect(payload?.error.code).toBe('SERVER_DEPENDENCY_UNAVAILABLE');
  });
});
