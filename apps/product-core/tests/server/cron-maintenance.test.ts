import { describe, expect, test, mock, beforeEach } from 'bun:test';

function createMockDb() {
  const createUpdateChain = (returningLength: number) => {
    const chain: any = {
      set: mock(() => chain),
      where: mock(() => chain),
      returning: mock(() => Promise.resolve(new Array(returningLength).fill(1))),
    };
    return chain;
  };

  const createDeleteChain = (returningLength: number) => {
    const chain: any = {
      where: mock(() => chain),
      returning: mock(() => Promise.resolve(new Array(returningLength).fill(1))),
    };
    return chain;
  };

  const mockSelectChain = {
    from: mock(() => ({
      where: mock(() => Promise.resolve([{ userId: 'user-expired-1' }, { userId: 'user-expired-2' }])),
    })),
  };

  return {
    update: mock((table: any) => {
      if (table.name === 'vip_subscriptions') return createUpdateChain(1);
      return createUpdateChain(2); // memberCards and businessProfiles
    }),
    delete: mock(() => createDeleteChain(5)),
    selectDistinct: mock(() => mockSelectChain),
    query: {
      businessProfiles: {
        findMany: mock(() =>
          Promise.resolve([
            { id: 'bus-1', status: 'PUBLISHED', userId: 'user-expired-1' },
            { id: 'bus-2', status: 'PUBLISHED', userId: 'user-expired-2' },
          ]),
        ),
      },
    },
    transaction: mock(async (fn: any) => {
      const tx = {
        update: mock(() => createUpdateChain(2)),
      };
      return fn(tx);
    }),
  };
}

let mockDb: ReturnType<typeof createMockDb>;

// @ts-ignore
Object.defineProperty(globalThis, 'dbMockForBun', {
  get: () => mockDb,
  configurable: true
});

mock.module('@/server/db', () => ({
  getDbClient: () => {
    // @ts-ignore
    if (globalThis.dbMockForBun) return globalThis.dbMockForBun;
    return mockDb;
  },
  schema: {
    memberCards: { name: 'member_cards' },
    vipSubscriptions: { name: 'vip_subscriptions' },
    stripeWebhookEvents: { name: 'stripe_webhook_events' },
    businessProfiles: { name: 'business_profiles' },
  },
}));

mock.module('@/server/audit', () => ({
  createDbAuditService: () => ({
    log: (...args: any[]) => {
      // @ts-ignore
      if (globalThis.auditLogMockForBun) return globalThis.auditLogMockForBun(...args);
      return Promise.resolve({ id: 'audit-1' });
    },
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
    mockDb = createMockDb();

    const result = await runDailyMaintenance();

    expect(result).toEqual({
      expiredCards: 2,
      expiredSubscriptions: 1,
      hiddenBusinesses: 2,
      cleanedEvents: 5,
    });
  });

  test('handles zero expired subscriptions gracefully', async () => {
    mockDb = createMockDb();
    mockDb.selectDistinct.mockImplementation(() => ({
      from: () => ({ where: () => Promise.resolve([]) }),
    }));

    const result = await runDailyMaintenance();

    expect(result.expiredCards).toBe(2);
    expect(result.expiredSubscriptions).toBe(1);
    expect(result.hiddenBusinesses).toBe(0);
    expect(result.cleanedEvents).toBe(5);
    expect(mockDb.query.businessProfiles.findMany).not.toHaveBeenCalled();
  });

  test('is idempotent on repeated calls', async () => {
    mockDb = createMockDb();

    const result1 = await runDailyMaintenance();
    const result2 = await runDailyMaintenance();

    expect(result1).toEqual(result2);
  });
});
