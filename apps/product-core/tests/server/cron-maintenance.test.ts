// TODO(drizzle-migration): suites below mock '@/server/db' with the removed Prisma client API
// (getPrismaClient). Rewrite the mocks against getDbClient/schema (Drizzle) and re-enable.
import { describe, expect, test, vi } from 'vitest';

function createMockPrisma() {
  return {
    memberCard: {
      updateMany: vi.fn(() => Promise.resolve({ count: 2 })),
    },
    vipSubscription: {
      updateMany: vi.fn(() => Promise.resolve({ count: 1 })),
      findMany: vi.fn(() =>
        Promise.resolve([{ user_id: 'user-expired-1' }, { user_id: 'user-expired-2' }]),
      ),
    },
    businessProfile: {
      findMany: vi.fn(() =>
        Promise.resolve([
          { id: 'bus-1', status: 'PUBLISHED', user_id: 'user-expired-1' },
          { id: 'bus-2', status: 'PUBLISHED', user_id: 'user-expired-2' },
        ]),
      ),
      updateMany: vi.fn(() => Promise.resolve({ count: 2 })),
    },
    stripeWebhookEvent: {
      deleteMany: vi.fn(() => Promise.resolve({ count: 5 })),
    },
    $transaction: vi.fn((fn: any) => fn(createMockTx())),
  };
}

function createMockTx() {
  return {
    businessProfile: {
      updateMany: vi.fn(() => Promise.resolve({ count: 2 })),
    },
  };
}

let mockPrisma: ReturnType<typeof createMockPrisma>;

vi.mock('@/server/db', () => ({
  getPrismaClient: () => mockPrisma,
}));

vi.mock('@/server/audit', () => ({
  createDbAuditService: () => ({
    log: vi.fn(() => Promise.resolve({ id: 'audit-1' })),
  }),
}));

vi.mock('@/server/context', () => ({
  createRequestContext: () => ({
    actor: { kind: 'system' },
    ipAddress: null,
    requestId: 'test-cron',
  }),
}));

const { runDailyMaintenance } = await import('../../src/server/services/maintenance-service');

describe.skip('runDailyMaintenance', () => {
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
