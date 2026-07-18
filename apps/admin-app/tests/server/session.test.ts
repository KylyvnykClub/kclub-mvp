import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { mockCookieStore, resetMockCookieStore } from '../test-helpers/mock-cookies';

const { readStaffSession, setStaffSession, clearStaffSession } =
  await import('../../src/server/auth/session');

describe('session', () => {
  beforeEach(() => {
    resetMockCookieStore();
  });

  afterEach(() => {
    resetMockCookieStore();
  });

  test('readStaffSession returns null when no cookie exists', async () => {
    const session = await readStaffSession();
    expect(session).toBeNull();
  });

  test('readStaffSession returns session when cookie exists', async () => {
    mockCookieStore.get.mockImplementation((name: string) =>
      name === 'kclub_staff_session' ? { value: 'test-token' } : undefined,
    );
    const session = await readStaffSession();
    expect(session?.token).toBe('test-token');
    expect(session?.expiresAtIso).toBeDefined();
  });

  test('setStaffSession sets cookie with correct attributes', async () => {
    await setStaffSession('test-token');
    expect(mockCookieStore.set).toHaveBeenCalledWith('kclub_staff_session', 'test-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
  });

  test('clearStaffSession clears the cookie', async () => {
    await clearStaffSession();
    expect(mockCookieStore.set).toHaveBeenCalledWith('kclub_staff_session', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });
  });
});
