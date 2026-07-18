import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { mockCookieStore, resetMockCookieStore } from '../test-helpers/mock-cookies';

const mockRedirect = vi.fn(() => {
  throw new Error('REDIRECT');
});

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

const originalFetch = globalThis.fetch;

describe('auth actions', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    resetMockCookieStore();
    process.env.PRODUCT_CORE_API_BASE_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetMockCookieStore();
    delete process.env.PRODUCT_CORE_API_BASE_URL;
  });

  describe('signInStaffAction', () => {
    test('redirects with error when product-core returns failure', async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        json: async () => ({
          data: null,
          error: { code: 'AUTH_PASSWORD_INVALID', message: 'Invalid staff phone or password' },
        }),
      })) as unknown as typeof fetch;

      const { signInStaffAction } = await import('../../src/server/auth/actions');

      const formData = new FormData();
      formData.set('phone', '+15550000000');
      formData.set('password', 'WrongPassword123');

      try {
        await signInStaffAction(formData);
      } catch {
        // redirect throws
      }

      expect(mockRedirect).toHaveBeenCalledWith(
        '/auth/sign-in?error=Invalid%20staff%20phone%20or%20password',
      );
    });

    test('sets session and redirects to dashboard on successful sign-in', async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            state: 'AUTHENTICATED',
            token: 'session-token',
            expiresAt: '2026-12-31T23:59:59.000Z',
            profile: { id: '1', phone: '+15551234567', role: 'OWNER' },
          },
          error: null,
        }),
      })) as unknown as typeof fetch;

      const { signInStaffAction } = await import('../../src/server/auth/actions');

      const formData = new FormData();
      formData.set('phone', '+15551234567');
      formData.set('password', 'OwnerPassword123');

      try {
        await signInStaffAction(formData);
      } catch {
        // redirect throws
      }

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'kclub_staff_session',
        'session-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('registerStaffPasswordAction', () => {
    test('redirects with error when registration fails', async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        json: async () => ({
          data: null,
          error: { code: 'AUTH_STAFF_NOT_ALLOWED', message: 'Phone not approved' },
        }),
      })) as unknown as typeof fetch;

      const { registerStaffPasswordAction } = await import('../../src/server/auth/actions');

      const formData = new FormData();
      formData.set('phone', '+15550000000');
      formData.set('password', 'OwnerPassword123');

      try {
        await registerStaffPasswordAction(formData);
      } catch {
        // redirect throws
      }

      expect(mockRedirect).toHaveBeenCalledWith('/auth/register?error=Phone%20not%20approved');
    });

    test('redirects to sign-in when password registration succeeds', async () => {
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({ data: { registered: true }, error: null }),
      })) as unknown as typeof fetch;

      const { registerStaffPasswordAction } = await import('../../src/server/auth/actions');

      const formData = new FormData();
      formData.set('phone', '+15551234567');
      formData.set('password', 'OwnerPassword123');

      try {
        await registerStaffPasswordAction(formData);
      } catch {
        // redirect throws
      }

      expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in?registered=1&phone=%2B15551234567');
    });
  });

  describe('logoutAction', () => {
    test('clears session and redirects to sign-in', async () => {
      mockCookieStore.get.mockImplementation((name: string) =>
        name === 'kclub_staff_session' ? { value: 'test-token' } : undefined,
      );

      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({ data: { loggedOut: true }, error: null }),
      })) as unknown as typeof fetch;

      const { logoutAction } = await import('../../src/server/auth/actions');

      try {
        await logoutAction();
      } catch {
        // redirect throws
      }

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'kclub_staff_session',
        '',
        expect.objectContaining({ maxAge: 0 }),
      );
      expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in');
    });

    test('calls product-core logout endpoint before clearing cookie', async () => {
      mockCookieStore.get.mockImplementation((name: string) =>
        name === 'kclub_staff_session' ? { value: 'test-token' } : undefined,
      );

      const fetchMock = vi.fn(async () => ({
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
