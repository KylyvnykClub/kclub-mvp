import { beforeEach, describe, expect, test } from 'vitest';

import {
  __resetStaffAuthRateLimitersForTests,
  __setStaffAuthRateLimiterForTests,
} from '../src/server/staff-auth-rate-limit';
import {
  handleStaffPasswordSignIn,
  handleStaffSession,
  handleStaffLogout,
} from '../src/server/staff-auth';

const OWNER_PHONE = '+15551234567';
const OWNER_PASSWORD = 'OwnerPassword123';

function jsonRequest(body: Record<string, string>, token?: string) {
  return new Request('http://localhost/api/admin/v1/staff-auth', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

describe('staff auth boundary', () => {
  beforeEach(() => {
    process.env.ADMIN_BOOTSTRAP_OWNER_PHONE = OWNER_PHONE;
    process.env.ADMIN_BOOTSTRAP_OWNER_PASSWORD = OWNER_PASSWORD;
    process.env.ADMIN_JWT_SECRET = 'staff-auth-test-secret-at-least-32-chars';
    delete process.env.ADMIN_STAFF_ALLOWLIST_JSON;
    __resetStaffAuthRateLimitersForTests();
  });

  test('rejects unknown staff phone during password sign-in', async () => {
    const response = await handleStaffPasswordSignIn(
      jsonRequest({ phone: '+15550000000', password: OWNER_PASSWORD }),
    );
    const payload = await readJson<{ error: { code: string } }>(response);

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe('AUTH_STAFF_NOT_ALLOWED');
  });

  test('allows bootstrap owner through password sign-in', async () => {
    const response = await handleStaffPasswordSignIn(
      jsonRequest({ phone: OWNER_PHONE, password: OWNER_PASSWORD }),
    );
    const payload = await readJson<{
      data: { state: string; token: string; profile: { role: string } };
    }>(response);

    expect(response.status).toBe(200);
    expect(payload.data.state).toBe('AUTHENTICATED');
    expect(payload.data.profile.role).toBe('OWNER');

    const sessionResponse = await handleStaffSession(
      new Request('http://localhost/api/admin/v1/staff-auth/session', {
        headers: { authorization: `Bearer ${payload.data.token}` },
      }),
    );
    const sessionPayload = await readJson<{ data: { role: string } }>(sessionResponse);
    expect(sessionPayload.data.role).toBe('OWNER');
  });

  test('rejects invalid bootstrap owner password', async () => {
    const response = await handleStaffPasswordSignIn(
      jsonRequest({ phone: OWNER_PHONE, password: 'WrongPassword123' }),
    );
    const payload = await readJson<{ error: { code: string } }>(response);

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe('AUTH_PASSWORD_INVALID');
  });

  test('returns 429 when password sign-in is rate limited', async () => {
    __setStaffAuthRateLimiterForTests('password-sign-in', {
      limit: async () => ({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 10_000,
      }),
    });

    const response = await handleStaffPasswordSignIn(
      jsonRequest({ phone: OWNER_PHONE, password: OWNER_PASSWORD }),
    );
    const payload = await readJson<{ error: { code: string } }>(response);

    expect(response.status).toBe(429);
    expect(payload.error.code).toBe('RATE_LIMITED');
  });

  test('rejects forged staff session tokens', async () => {
    const forgedToken = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(
        JSON.stringify({
          sub: 'bootstrap-owner-+15551234567',
          phone: OWNER_PHONE,
          role: 'OWNER',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64url'),
      'bad-signature',
    ].join('.');

    const response = await handleStaffSession(
      new Request('http://localhost/api/admin/v1/staff-auth/session', {
        headers: { authorization: `Bearer ${forgedToken}` },
      }),
    );
    const payload = await readJson<{ error: { code: string } }>(response);

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe('AUTH_SESSION_INVALID');
  });

  test('rejects expired JWT tokens', async () => {
    const expiredToken = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(
        JSON.stringify({
          sub: 'bootstrap-owner-+15551234567',
          phone: OWNER_PHONE,
          name: 'Bootstrap Owner',
          role: 'OWNER',
          exp: Math.floor(Date.now() / 1000) - 100,
        }),
      ).toString('base64url'),
    ];
    const headerBody = `${expiredToken[0]}.${expiredToken[1]}`;
    const { createHmac } = await import('node:crypto');
    const sig = createHmac('sha256', process.env.ADMIN_JWT_SECRET!)
      .update(headerBody)
      .digest('base64url');
    const token = `${headerBody}.${sig}`;

    const response = await handleStaffSession(
      new Request('http://localhost/api/admin/v1/staff-auth/session', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    const payload = await readJson<{ error: { code: string } }>(response);

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe('AUTH_SESSION_INVALID');
  });

  test('logout revokes the current session when available', async () => {
    const signInResponse = await handleStaffPasswordSignIn(
      jsonRequest({ phone: OWNER_PHONE, password: OWNER_PASSWORD }),
    );
    const signInPayload = await readJson<{ data: { token: string } }>(signInResponse);

    const logoutResponse = await handleStaffLogout(
      new Request('http://localhost/api/admin/v1/staff-auth/logout', {
        method: 'POST',
        headers: { authorization: `Bearer ${signInPayload.data.token}` },
      }),
    );
    const logoutPayload = await readJson<{ data: { loggedOut: boolean } }>(logoutResponse);

    expect(logoutResponse.status).toBe(200);
    expect(logoutPayload.data.loggedOut).toBe(true);
  });

  test('logout rejects missing token', async () => {
    const response = await handleStaffLogout(
      new Request('http://localhost/api/admin/v1/staff-auth/logout', { method: 'POST' }),
    );
    const payload = await readJson<{ error: { code: string } }>(response);

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe('AUTH_SESSION_REQUIRED');
  });
});
