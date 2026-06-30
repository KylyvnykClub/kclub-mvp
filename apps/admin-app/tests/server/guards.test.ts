import { beforeEach, afterEach, describe, expect, mock, test } from 'bun:test';

const mockReadStaffSession = mock();

mock.module('../../src/server/auth/session', () => ({
  readStaffSession: mockReadStaffSession,
}));

const mockRedirect = mock(() => {
  throw new Error('REDIRECT');
});

mock.module('next/navigation', () => ({
  redirect: mockRedirect,
}));

describe('guards', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockReadStaffSession.mockReset();
  });

  afterEach(() => {
    mockRedirect.mockClear();
    mockReadStaffSession.mockClear();
  });

  test('requireStaffSession redirects when no session exists', async () => {
    mockReadStaffSession.mockResolvedValue(null);
    const { requireStaffSession } = await import('../../src/server/auth/guards');

    try {
      await requireStaffSession();
    } catch {
      // redirect throws
    }

    expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in');
  });

  test('requireStaffSession returns session when it exists', async () => {
    mockReadStaffSession.mockResolvedValue({
      token: 'test-token',
      expiresAtIso: '2024-12-31T23:59:59.000Z',
    });
    const { requireStaffSession } = await import('../../src/server/auth/guards');

    const session = await requireStaffSession();

    expect(session?.token).toBe('test-token');
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
