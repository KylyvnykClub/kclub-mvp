import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

const mockRedirect = mock(() => {
  throw new Error('REDIRECT');
});
const mockCookies = mock();

mock.module('next/navigation', () => ({
  redirect: mockRedirect,
}));

mock.module('next/headers', () => ({
  cookies: mockCookies,
}));

const originalFetch = globalThis.fetch;

describe('auth actions', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockCookies.mockReset();
    process.env.PRODUCT_CORE_API_BASE_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mockCookies.mockReset();
    delete process.env.PRODUCT_CORE_API_BASE_URL;
  });

  describe('sendStaffOtpAction', () => {
    test('redirects with error when product-core returns failure', async () => {
      globalThis.fetch = mock(async () => ({
        ok: false,
        json: async () => ({
          data: null,
          error: { code: 'AUTH_STAFF_NOT_ALLOWED', message: 'Phone not in staff allowlist' },
        }),
      })) as unknown as typeof fetch;

      const { sendStaffOtpAction } = await import('../../src/server/auth/actions');

      const formData = new FormData();
      formData.set('phone', '+15550000000');

      try {
        await sendStaffOtpAction(formData);
      } catch {
        // redirect throws
      }

      expect(mockRedirect).toHaveBeenCalledWith(
        '/auth/sign-in?error=Phone%20not%20in%20staff%20allowlist',
      );
    });

    test('redirects to sign-in with sent flag on success', async () => {
      globalThis.fetch = mock(async () => ({
        ok: true,
        json: async () => ({
          data: { state: 'OTP_REQUIRED', phone: '+15551234567' },
          error: null,
        }),
      })) as unknown as typeof fetch;

      const { sendStaffOtpAction } = await import('../../src/server/auth/actions');

      const formData = new FormData();
      formData.set('phone', '+15551234567');

      try {
        await sendStaffOtpAction(formData);
      } catch {
        // redirect throws
      }

      expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in?sent=1&phone=%2B15551234567');
    });
  });

  describe('verifyStaffOtpAction', () => {
    test('redirects with error when OTP is invalid', async () => {
      globalThis.fetch = mock(async () => ({
        ok: false,
        json: async () => ({
          data: null,
          error: { code: 'AUTH_OTP_INVALID', message: 'Invalid OTP code' },
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

      expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in?error=Invalid%20OTP%20code');
    });

    test('redirects to dashboard when OTP verified and state is AUTHENTICATED', async () => {
      mockCookies.mockResolvedValue({
        get: () => undefined,
        set: mock(),
      });

      globalThis.fetch = mock(async () => ({
        ok: true,
        json: async () => ({
          data: {
            state: 'AUTHENTICATED',
            token: 'session-token',
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

      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });

    test('redirects to 2fa-required when state is TOTP_REQUIRED', async () => {
      mockCookies.mockResolvedValue({
        get: () => undefined,
        set: mock(),
      });

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

      expect(mockRedirect).toHaveBeenCalledWith('/auth/2fa-required');
    });

    test('redirects to /auth/totp-setup when state is TOTP_SETUP_REQUIRED', async () => {
      mockCookies.mockResolvedValue({
        get: () => undefined,
        set: mock(),
      });

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

      expect(mockRedirect).toHaveBeenCalledWith('/auth/totp-setup');
    });
  });

  describe('verifyStaffTotpAction', () => {
    test('redirects to sign-in when no session exists', async () => {
      mockCookies.mockResolvedValue({
        get: () => undefined,
      });

      const { verifyStaffTotpAction } = await import('../../src/server/auth/actions');

      const formData = new FormData();
      formData.set('code', '123456');

      try {
        await verifyStaffTotpAction(formData);
      } catch {
        // redirect throws
      }

      expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in');
    });

    test('redirects with error when TOTP is invalid', async () => {
      mockCookies.mockResolvedValue({
        get: () => ({ value: 'pre-totp-token' }),
        set: mock(),
      });

      globalThis.fetch = mock(async () => ({
        ok: false,
        json: async () => ({
          data: null,
          error: { code: 'AUTH_OTP_INVALID', message: 'Invalid TOTP code' },
        }),
      })) as unknown as typeof fetch;

      const { verifyStaffTotpAction } = await import('../../src/server/auth/actions');

      const formData = new FormData();
      formData.set('code', '000000');

      try {
        await verifyStaffTotpAction(formData);
      } catch {
        // redirect throws
      }

      expect(mockRedirect).toHaveBeenCalledWith('/auth/2fa-required?error=Invalid%20TOTP%20code');
    });

    test('redirects to dashboard on successful TOTP verification', async () => {
      mockCookies.mockResolvedValue({
        get: () => ({ value: 'pre-totp-token' }),
        set: mock(),
      });

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

      const { verifyStaffTotpAction } = await import('../../src/server/auth/actions');

      const formData = new FormData();
      formData.set('code', '123456');

      try {
        await verifyStaffTotpAction(formData);
      } catch {
        // redirect throws
      }

      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('logoutAction', () => {
    test('clears session and redirects to sign-in', async () => {
      const setCookie = mock();
      mockCookies.mockResolvedValue({
        get: () => ({ value: 'test-token' }),
        set: setCookie,
      });

      globalThis.fetch = mock(async () => ({
        ok: true,
        json: async () => ({ data: { loggedOut: true }, error: null }),
      })) as unknown as typeof fetch;

      const { logoutAction } = await import('../../src/server/auth/actions');

      try {
        await logoutAction();
      } catch {
        // redirect throws
      }

      expect(setCookie).toHaveBeenCalledWith(
        'kclub_staff_session',
        '',
        expect.objectContaining({ maxAge: 0 }),
      );
      expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in');
    });

    test('calls product-core logout endpoint before clearing cookie', async () => {
      const setCookie = mock();
      mockCookies.mockResolvedValue({
        get: (name: string) =>
          name === 'kclub_staff_session' ? { value: 'test-token' } : undefined,
        set: setCookie,
      });

      const fetchMock = mock(async () => ({
        ok: true,
        json: async () => ({ data: { loggedOut: true }, error: null }),
      }));
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const { logoutAction } = await import('../../src/server/auth/actions');

      try {
        await logoutAction();
      } catch {
        // redirect throws
      }

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/v1/staff-auth/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ authorization: 'Bearer test-token' }),
        }),
      );
    });
  });
});
