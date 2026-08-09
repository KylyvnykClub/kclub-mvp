import { beforeEach, describe, expect, test, vi } from 'vitest';

const runDailyMaintenance = vi.fn();

vi.mock('@/server/services/maintenance-service', () => ({
  runDailyMaintenance,
}));

describe('cron route guard logic', () => {
  beforeEach(() => {
    vi.resetModules();
    runDailyMaintenance.mockReset();
  });

  test('returns 500 when CRON_SECRET is not set', async () => {
    const original = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    const { POST } = await import('../../src/app/api/cron/daily-maintenance/route');
    const request = new Request('http://localhost/api/cron/daily-maintenance', { method: 'POST' });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe('SERVER_DEPENDENCY_UNAVAILABLE');

    process.env.CRON_SECRET = original;
  });

  test('returns 401 when authorization is missing or invalid', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const { POST } = await import('../../src/app/api/cron/daily-maintenance/route');
    const missingResponse = await POST(
      new Request('http://localhost/api/cron/daily-maintenance', { method: 'POST' }),
    );
    const invalidResponse = await POST(
      new Request('http://localhost/api/cron/daily-maintenance', {
        method: 'POST',
        headers: { authorization: 'Bearer wrong-secret' },
      }),
    );

    expect(missingResponse.status).toBe(401);
    expect(invalidResponse.status).toBe(401);
  });

  test('returns the maintenance payload when authorized', async () => {
    process.env.CRON_SECRET = 'test-secret';
    runDailyMaintenance.mockResolvedValue({
      expiredCards: 1,
      expiredSubscriptions: 2,
      hiddenBusinesses: 3,
      cleanedEvents: 4,
    });

    const { POST } = await import('../../src/app/api/cron/daily-maintenance/route');
    const response = await POST(
      new Request('http://localhost/api/cron/daily-maintenance', {
        method: 'POST',
        headers: { authorization: 'Bearer test-secret' },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual({
      expiredCards: 1,
      expiredSubscriptions: 2,
      hiddenBusinesses: 3,
      cleanedEvents: 4,
    });
  });

  test('GET (Vercel Cron) is authorized with the same bearer secret', async () => {
    process.env.CRON_SECRET = 'test-secret';
    runDailyMaintenance.mockResolvedValue({
      expiredCards: 0,
      expiredSubscriptions: 0,
      hiddenBusinesses: 0,
      cleanedEvents: 0,
    });

    const { GET } = await import('../../src/app/api/cron/daily-maintenance/route');

    const unauthorized = await GET(
      new Request('http://localhost/api/cron/daily-maintenance', { method: 'GET' }),
    );
    expect(unauthorized.status).toBe(401);

    const authorized = await GET(
      new Request('http://localhost/api/cron/daily-maintenance', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      }),
    );
    expect(authorized.status).toBe(200);
    expect(runDailyMaintenance).toHaveBeenCalledTimes(1);
  });
});
