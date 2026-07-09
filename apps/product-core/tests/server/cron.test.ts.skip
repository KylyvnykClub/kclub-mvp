import { describe, expect, test, mock } from 'bun:test';

const mockUpdateMany = mock(async () => ({ count: 0 }));
const mockFindMany = mock(async () => []);
const mockDeleteMany = mock(async () => ({ count: 0 }));

mock.module('@/server/db', () => {
  const mockPrisma = {
    memberCard: { updateMany: mockUpdateMany },
    vipSubscription: { updateMany: mockUpdateMany, findMany: mockFindMany },
    businessProfile: { updateMany: mockUpdateMany },
    stripeWebhookEvent: { deleteMany: mockDeleteMany },
  };
  return {
    getPrismaClient: () => mockPrisma,
  };
});

describe('cron route guard logic', () => {
  test('returns 500 when CRON_SECRET is not set', async () => {
    const original = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    const { POST } = await import('../../src/app/api/cron/daily-maintenance/route');
    const request = new Request('http://localhost/api/cron/daily-maintenance', { method: 'POST' });
    const response = await POST(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe('SERVER_ERROR');

    process.env.CRON_SECRET = original;
  });

  test('returns 401 when Authorization header is missing', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const { POST } = await import('../../src/app/api/cron/daily-maintenance/route');
    const request = new Request('http://localhost/api/cron/daily-maintenance', { method: 'POST' });
    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('PERMISSION_DENIED');
  });

  test('returns 401 when Authorization header has wrong secret', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const { POST } = await import('../../src/app/api/cron/daily-maintenance/route');
    const request = new Request('http://localhost/api/cron/daily-maintenance', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('PERMISSION_DENIED');
  });

  test('returns 200 with result counts when authorized with correct secret', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const { POST } = await import('../../src/app/api/cron/daily-maintenance/route');
    const request = new Request('http://localhost/api/cron/daily-maintenance', {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret' },
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(typeof body.data.cardsExpired).toBe('number');
    expect(typeof body.data.subscriptionsExpired).toBe('number');
    expect(typeof body.data.businessesHidden).toBe('number');
    expect(typeof body.data.webhookEventsCleaned).toBe('number');
  });
});
