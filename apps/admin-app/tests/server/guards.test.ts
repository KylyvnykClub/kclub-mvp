import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { mockCookieStore, resetMockCookieStore } from '../test-helpers/mock-cookies';

const mockRedirect = vi.fn(() => {
  throw new Error('REDIRECT');
});

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

describe('guards', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    resetMockCookieStore();
  });

  afterEach(() => {
    mockRedirect.mockClear();
    resetMockCookieStore();
  });

  test('requireStaffSession redirects when no session exists', async () => {
    const { requireStaffSession } = await import('../../src/server/auth/guards');

    try {
      await requireStaffSession();
    } catch {
      // redirect throws
    }

    expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in');
  });

  test('requireStaffSession returns session when it exists', async () => {
    mockCookieStore.get.mockImplementation((name: string) =>
      name === 'kclub_staff_session' ? { value: 'test-token' } : undefined,
    );
    const { requireStaffSession } = await import('../../src/server/auth/guards');

    const session = await requireStaffSession();

    expect(session?.token).toBe('test-token');
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
