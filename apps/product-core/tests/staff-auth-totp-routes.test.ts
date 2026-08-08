import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  __resetStaffAuthRateLimitersForTests,
  __setStaffAuthRateLimiterForTests,
} from '../src/server/staff-auth-rate-limit';

const getBearerToken = vi.fn();
const getStaffSession = vi.fn();
const hasVerifiedTotp = vi.fn();
const setupTotp = vi.fn();
const verifyAndActivateTotp = vi.fn();
const verifyTotpCode = vi.fn();

vi.mock('@/server/staff-auth', () => ({
  getBearerToken,
  getStaffSession,
}));

vi.mock('@/server/staff-totp', () => ({
  hasVerifiedTotp,
  setupTotp,
  verifyAndActivateTotp,
  verifyTotpCode,
}));

describe('staff auth totp routes', () => {
  beforeEach(() => {
    __resetStaffAuthRateLimitersForTests();
    getBearerToken.mockReset();
    getStaffSession.mockReset();
    hasVerifiedTotp.mockReset();
    setupTotp.mockReset();
    verifyAndActivateTotp.mockReset();
    verifyTotpCode.mockReset();

    getBearerToken.mockReturnValue('token-1');
    getStaffSession.mockResolvedValue({
      id: 'staff-1',
      phone: '+15550000000',
      displayName: 'Staff',
      role: 'ADMIN',
      permissionOverrides: null,
    });
  });

  test('returns 429 when totp verify is rate limited', async () => {
    __setStaffAuthRateLimiterForTests('totp-verify', {
      limit: async () => ({
        success: false,
        limit: 8,
        remaining: 0,
        reset: Date.now() + 5_000,
      }),
    });

    const { POST } = await import('../src/app/api/admin/v1/staff-auth/totp/verify/route');
    const response = await POST(
      new Request('http://localhost/api/admin/v1/staff-auth/totp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: '123456' }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.error.code).toBe('RATE_LIMITED');
  });

  test('returns 429 when totp setup is rate limited', async () => {
    __setStaffAuthRateLimiterForTests('totp-setup', {
      limit: async () => ({
        success: false,
        limit: 3,
        remaining: 0,
        reset: Date.now() + 5_000,
      }),
    });

    const { POST } = await import('../src/app/api/admin/v1/staff-auth/totp/setup/route');
    const response = await POST(
      new Request('http://localhost/api/admin/v1/staff-auth/totp/setup', {
        method: 'POST',
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.error.code).toBe('RATE_LIMITED');
  });

  test('returns 503 when strict totp verify enforcement has no backend', async () => {
    process.env.STAFF_AUTH_RATE_LIMIT_REQUIRED = 'true';

    const { POST } = await import('../src/app/api/admin/v1/staff-auth/totp/verify/route');
    const response = await POST(
      new Request('http://localhost/api/admin/v1/staff-auth/totp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: '123456' }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error.code).toBe('SERVER_DEPENDENCY_UNAVAILABLE');

    delete process.env.STAFF_AUTH_RATE_LIMIT_REQUIRED;
  });
});
