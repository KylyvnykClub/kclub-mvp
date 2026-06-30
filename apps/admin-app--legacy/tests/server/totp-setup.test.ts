import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

const mockReadStaffSession = mock();
const mockSetStaffSession = mock();

mock.module('@/server/auth/session', () => ({
  readStaffSession: mockReadStaffSession,
  setStaffSession: mockSetStaffSession,
  clearStaffSession: mock(),
  STAFF_SESSION_COOKIE: 'kclub_staff_session',
  STAFF_SESSION_TTL_SECONDS: 28800,
}));

const mockRedirect = mock(() => {
  throw new Error('REDIRECT');
});

mock.module('next/navigation', () => ({
  redirect: mockRedirect,
}));

const originalFetch = globalThis.fetch;

describe('setupStaffTotpAction', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockReadStaffSession.mockReset();
    mockSetStaffSession.mockReset();
    process.env.PRODUCT_CORE_API_BASE_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.PRODUCT_CORE_API_BASE_URL;
  });

  test('redirects to sign-in when no session exists', async () => {
    mockReadStaffSession.mockResolvedValue(null);

    const { setupStaffTotpAction } = await import('../../src/server/auth/actions');

    try {
      await setupStaffTotpAction();
    } catch {
      // redirect throws
    }

    expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in');
  });

  test('returns setup data on success', async () => {
    mockReadStaffSession.mockResolvedValue({
      token: 'pre-totp-token',
      expiresAtIso: '2026-12-31T23:59:59.000Z',
    });

    globalThis.fetch = mock(async () => ({
      ok: true,
      json: async () => ({
        data: {
          provisioningUri: 'otpauth://totp/KCLUB:+15551234567?secret=JBSWY3DPEHPK3PXP',
          manualKey: 'JBSWY3DPEHPK3PXP',
        },
        error: null,
      }),
    })) as unknown as typeof fetch;

    const { setupStaffTotpAction } = await import('../../src/server/auth/actions');

    const result = await setupStaffTotpAction();

    expect(result).not.toBeNull();
    expect(result?.provisioningUri).toContain('otpauth://totp/');
    expect(result?.manualKey).toBe('JBSWY3DPEHPK3PXP');
  });

  test('returns null when product-core returns error', async () => {
    mockReadStaffSession.mockResolvedValue({
      token: 'pre-totp-token',
      expiresAtIso: '2026-12-31T23:59:59.000Z',
    });

    globalThis.fetch = mock(async () => ({
      ok: false,
      json: async () => ({
        data: null,
        error: { code: 'AUTH_SESSION_INVALID', message: 'Invalid session' },
      }),
    })) as unknown as typeof fetch;

    const { setupStaffTotpAction } = await import('../../src/server/auth/actions');

    const result = await setupStaffTotpAction();

    expect(result).toBeNull();
  });
});

describe('verifyStaffOtpAction state differentiation', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockSetStaffSession.mockReset();
    process.env.PRODUCT_CORE_API_BASE_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.PRODUCT_CORE_API_BASE_URL;
  });

  test('redirects to /auth/totp-setup when state is TOTP_SETUP_REQUIRED', async () => {
    globalThis.fetch = mock(async () => ({
      ok: true,
      json: async () => ({
        data: {
          state: 'TOTP_SETUP_REQUIRED',
          token: 'pre-totp-token',
          expiresAt: '2026-12-31T23:59:59.000Z',
          profile: { id: '1', phone: '+15551234567', role: 'OWNER', totpVerified: false },
        },
        error: null,
      }),
    })) as unknown as typeof fetch;

    const { verifyStaffOtpAction } = await import('../../src/server/auth/actions');

    const formData = new FormData();
    formData.set('phone', '+15551234567');
    formData.set('code', '000000');

    try {
      await verifyStaffOtpAction(formData);
    } catch {
      // redirect throws
    }

    expect(mockSetStaffSession).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith('/auth/totp-setup');
  });

  test('redirects to /auth/2fa-required when state is TOTP_REQUIRED', async () => {
    globalThis.fetch = mock(async () => ({
      ok: true,
      json: async () => ({
        data: {
          state: 'TOTP_REQUIRED',
          token: 'pre-totp-token',
          expiresAt: '2026-12-31T23:59:59.000Z',
          profile: { id: '1', phone: '+15551234567', role: 'OWNER', totpVerified: false },
        },
        error: null,
      }),
    })) as unknown as typeof fetch;

    const { verifyStaffOtpAction } = await import('../../src/server/auth/actions');

    const formData = new FormData();
    formData.set('phone', '+15551234567');
    formData.set('code', '000000');

    try {
      await verifyStaffOtpAction(formData);
    } catch {
      // redirect throws
    }

    expect(mockSetStaffSession).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith('/auth/2fa-required');
  });

  test('redirects to /dashboard when state is AUTHENTICATED', async () => {
    globalThis.fetch = mock(async () => ({
      ok: true,
      json: async () => ({
        data: {
          state: 'AUTHENTICATED',
          token: 'verified-token',
          expiresAt: '2026-12-31T23:59:59.000Z',
          profile: { id: '1', phone: '+15551234567', role: 'OWNER', totpVerified: true },
        },
        error: null,
      }),
    })) as unknown as typeof fetch;

    const { verifyStaffOtpAction } = await import('../../src/server/auth/actions');

    const formData = new FormData();
    formData.set('phone', '+15551234567');
    formData.set('code', '000000');

    try {
      await verifyStaffOtpAction(formData);
    } catch {
      // redirect throws
    }

    expect(mockSetStaffSession).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });
});
