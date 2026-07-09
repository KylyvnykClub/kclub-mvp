import { describe, expect, test, mock } from 'bun:test';

function createMockPrisma() {
  return {
    memberCard: {
      updateMany: mock(() => Promise.resolve({ count: 2 })),
    },
    vipSubscription: {
      updateMany: mock(() => Promise.resolve({ count: 1 })),
      findMany: mock(() =>
        Promise.resolve([{ user_id: 'user-expired-1' }, { user_id: 'user-expired-2' }]),
      ),
    },
    businessProfile: {
      findMany: mock(() =>
        Promise.resolve([
          { id: 'bus-1', status: 'PUBLISHED', user_id: 'user-expired-1' },
          { id: 'bus-2', status: 'PUBLISHED', user_id: 'user-expired-2' },
        ]),
      ),
      updateMany: mock(() => Promise.resolve({ count: 2 })),
    },
    stripeWebhookEvent: {
      deleteMany: mock(() => Promise.resolve({ count: 5 })),
    },
    $transaction: mock((fn: any) => fn(createMockTx())),
  };
}

function createMockTx() {
  return {
    businessProfile: {
      updateMany: mock(() => Promise.resolve({ count: 2 })),
    },
  };
}

let mockPrisma: ReturnType<typeof createMockPrisma>;

mock.module('@/server/db', () => ({
  getPrismaClient: () => mockPrisma,
}));

mock.module('@/server/audit', () => ({
  createDbAuditService: () => ({
    log: mock(() => Promise.resolve({ id: 'audit-1' })),
  }),
}));

mock.module('@/server/context', () => ({
  createRequestContext: () => ({
    actor: { kind: 'system' },
    ipAddress: null,
    requestId: 'test-cron',
  }),
}));

const { runDailyMaintenance } = await import('../../src/server/services/maintenance-service');

describe('runDailyMaintenance', () => {
  test('returns result counts for all actions', async () => {
    mockPrisma = createMockPrisma();

    const result = await runDailyMaintenance();

    expect(result).toEqual({
      expiredCards: 2,
      expiredSubscriptions: 1,
      hiddenBusinesses: 2,
      cleanedEvents: 5,
    });
  });

  test('handles zero expired subscriptions gracefully', async () => {
    mockPrisma = createMockPrisma();
    mockPrisma.vipSubscription.findMany.mockImplementation(() => Promise.resolve([]));

    const result = await runDailyMaintenance();

    expect(result.expiredCards).toBe(2);
    expect(result.expiredSubscriptions).toBe(1);
    expect(result.hiddenBusinesses).toBe(0);
    expect(result.cleanedEvents).toBe(5);
    expect(mockPrisma.businessProfile.findMany).not.toHaveBeenCalled();
  });

  test('is idempotent on repeated calls', async () => {
    mockPrisma = createMockPrisma();

    const result1 = await runDailyMaintenance();
    const result2 = await runDailyMaintenance();

    expect(result1).toEqual(result2);
  });
});
