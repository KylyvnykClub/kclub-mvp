import { describe, expect, test, mock, beforeEach } from 'bun:test';

mock.module('@/server/db', () => {
  const createChain = () => {
    const chain: any = {
      set: mock(() => chain),
      where: mock(() => chain),
      returning: mock(() => Promise.resolve([])),
    };
    return chain;
  };
  return {
    getDbClient: () => {
      // @ts-ignore
      if (globalThis.dbMockForBun) return globalThis.dbMockForBun;
      const mockDb = {
        update: mock(createChain),
        delete: mock(createChain),
        selectDistinct: mock(() => ({
          from: mock(() => ({ where: mock(() => Promise.resolve([])) })),
        })),
      };
      return mockDb;
    },
    getPrismaClient: () => ({}),
    schema: {
      memberCards: { name: 'member_cards' },
      vipSubscriptions: { name: 'vip_subscriptions' },
      stripeWebhookEvents: { name: 'stripe_webhook_events' },
    },
  };
});

describe('cron route guard logic', () => {
  beforeEach(() => {
    // @ts-ignore
    delete globalThis.dbMockForBun;
    // @ts-ignore
    delete globalThis.auditLogMockForBun;
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

  test('returns 401 when Authorization header is missing', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const { POST } = await import('../../src/app/api/cron/daily-maintenance/route?auth=2');
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
    expect(typeof body.data.expiredCards).toBe('number');
    expect(typeof body.data.expiredSubscriptions).toBe('number');
    expect(typeof body.data.hiddenBusinesses).toBe('number');
    expect(typeof body.data.cleanedEvents).toBe('number');
  });
});
