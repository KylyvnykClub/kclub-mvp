import { beforeEach, describe, expect, test } from 'bun:test';
import * as OTPAuth from 'otpauth';

import {
  handleStaffOtpVerify,
  handleStaffTotpSetup,
  handleStaffTotpVerify,
  handleStaffSession,
} from '../../src/server/staff-auth';

const OWNER_PHONE = '+15551234567';

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

function getRequest(token?: string) {
  return new Request('http://localhost/api/admin/v1/staff-auth/totp/setup', {
    method: 'GET',
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function generateTotpCode(secret: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: 'KCLUB',
    label: OWNER_PHONE,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  return totp.generate();
}

describe('totp setup flow', () => {
  beforeEach(() => {
    process.env.ADMIN_BOOTSTRAP_OWNER_PHONE = OWNER_PHONE;
    process.env.ADMIN_JWT_SECRET = 'totp-setup-test-secret-at-least-32-chars';
    process.env.ADMIN_STAFF_DEV_OTP = '000000';
    process.env.ADMIN_STAFF_DEV_TOTP = '123456';
    process.env.TOTP_ENCRYPTION_KEY = 'j/iTO3OJ7xgfbpuJ+QOeFKp/zALyt9AnPxLNIC96BMQ=';
    delete process.env.ADMIN_STAFF_ALLOWLIST_JSON;
  });

  test('setup endpoint rejects unauthenticated requests', async () => {
    const response = await handleStaffTotpSetup(getRequest());
    const payload = await readJson<{ error: { code: string } }>(response);

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe('AUTH_SESSION_REQUIRED');
  });

  test('setup endpoint rejects invalid tokens', async () => {
    const response = await handleStaffTotpSetup(getRequest('invalid-token'));
    const payload = await readJson<{ error: { code: string } }>(response);

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe('AUTH_SESSION_INVALID');
  });

  test('setup endpoint returns provisioning URI and manual key', async () => {
    const otpResponse = await handleStaffOtpVerify(
      jsonRequest({ phone: OWNER_PHONE, code: '000000' }),
    );
    const otpPayload = await readJson<{ data: { token: string } }>(otpResponse);

    const setupResponse = await handleStaffTotpSetup(getRequest(otpPayload.data.token));
    const setupPayload = await readJson<{
      data: { provisioningUri: string; manualKey: string };
    }>(setupResponse);

    expect(setupResponse.status).toBe(200);
    expect(setupPayload.data.provisioningUri).toContain('otpauth://totp/');
    expect(setupPayload.data.provisioningUri).toContain('KCLUB');
    expect(setupPayload.data.manualKey).toMatch(/^[A-Z2-7=]+$/i);
    expect(setupPayload.data.manualKey.length).toBeGreaterThan(16);
  });

  test('setup endpoint is idempotent - returns same secret on repeated calls', async () => {
    const otpResponse = await handleStaffOtpVerify(
      jsonRequest({ phone: OWNER_PHONE, code: '000000' }),
    );
    const otpPayload = await readJson<{ data: { token: string } }>(otpResponse);

    const setup1 = await handleStaffTotpSetup(getRequest(otpPayload.data.token));
    const payload1 = await readJson<{ data: { manualKey: string } }>(setup1);

    const setup2 = await handleStaffTotpSetup(getRequest(otpPayload.data.token));
    const payload2 = await readJson<{ data: { manualKey: string } }>(setup2);

    expect(payload1.data.manualKey).toBe(payload2.data.manualKey);
  });

  test('full flow: OTP -> setup -> verify -> authenticated', async () => {
    const otpResponse = await handleStaffOtpVerify(
      jsonRequest({ phone: OWNER_PHONE, code: '000000' }),
    );
    const otpPayload = await readJson<{ data: { token: string; state: string } }>(otpResponse);

    expect(otpPayload.data.state).toBe('TOTP_SETUP_REQUIRED');

    const setupResponse = await handleStaffTotpSetup(getRequest(otpPayload.data.token));
    const setupPayload = await readJson<{ data: { manualKey: string } }>(setupResponse);
    expect(setupResponse.status).toBe(200);

    const totpResponse = await handleStaffTotpVerify(
      jsonRequest({ code: generateTotpCode(setupPayload.data.manualKey) }, otpPayload.data.token),
    );
    const totpPayload = await readJson<{
      data: { state: string; token: string; profile: { totpVerified: boolean } };
    }>(totpResponse);

    expect(totpResponse.status).toBe(200);
    expect(totpPayload.data.state).toBe('AUTHENTICATED');
    expect(totpPayload.data.profile.totpVerified).toBe(true);

    const sessionResponse = await handleStaffSession(
      new Request('http://localhost/api/admin/v1/staff-auth/session', {
        headers: { authorization: `Bearer ${totpPayload.data.token}` },
      }),
    );
    const sessionPayload = await readJson<{ data: { totpVerified: boolean } }>(sessionResponse);

    expect(sessionPayload.data.totpVerified).toBe(true);
  });

  test('verify rejects invalid TOTP code', async () => {
    const otpResponse = await handleStaffOtpVerify(
      jsonRequest({ phone: OWNER_PHONE, code: '000000' }),
    );
    const otpPayload = await readJson<{ data: { token: string } }>(otpResponse);

    await handleStaffTotpSetup(getRequest(otpPayload.data.token));

    const totpResponse = await handleStaffTotpVerify(
      jsonRequest({ code: '999999' }, otpPayload.data.token),
    );
    const totpPayload = await readJson<{ error: { code: string } }>(totpResponse);

    expect(totpResponse.status).toBe(401);
    expect(totpPayload.error.code).toBe('AUTH_STAFF_2FA_REQUIRED');
  });
});
