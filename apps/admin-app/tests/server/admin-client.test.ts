import { beforeEach, describe, expect, mock, test } from 'bun:test';

import { adminApiFetch } from '../../src/server/proxy/admin-client';

const mockReadStaffSession = mock();

mock.module('../../src/server/auth/session', () => ({
  readStaffSession: mockReadStaffSession,
}));

describe('admin-client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockReadStaffSession.mockReset();
    globalThis.fetch = originalFetch;
  });

  test('returns 401 when no session exists', async () => {
    mockReadStaffSession.mockResolvedValue(null);
    const result = await adminApiFetch('/test');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toBe('UNAUTHENTICATED_STAFF_SESSION');
  });

  test('makes authenticated request when session exists', async () => {
    mockReadStaffSession.mockResolvedValue({ token: 'test-token' });

    const mockResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: { id: '123' } }),
    };

    globalThis.fetch = mock(() => Promise.resolve(mockResponse)) as any;

    const result = await adminApiFetch('/test');

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ data: { id: '123' } });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/v1/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  test('handles API errors correctly', async () => {
    mockReadStaffSession.mockResolvedValue({ token: 'test-token' });

    const mockResponse = {
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: { code: 'PERMISSION_DENIED' } }),
    };

    globalThis.fetch = mock(() => Promise.resolve(mockResponse)) as any;

    const result = await adminApiFetch('/test');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toBe('ADMIN_API_403');
  });
});
