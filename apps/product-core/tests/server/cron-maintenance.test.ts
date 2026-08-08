import { beforeEach, describe, expect, test, vi } from 'vitest';

type MockDb = ReturnType<typeof createMockDb>;

const auditLog = vi.fn(() => Promise.resolve({ id: 'audit-1' }));

let mockDb: MockDb;

function createMockDb() {
  const selectDistinctQueue: unknown[][] = [];
  const updateReturningQueue: unknown[][] = [];
  const deleteReturningQueue: unknown[][] = [];
  const businessFindMany = vi.fn<() => Promise<Array<{ id: string; status: string }>>>(
    async () => [],
  );

  const createWhereChain = (queue: unknown[][]) => {
    const resultPromise = Promise.resolve(undefined) as Promise<void> & {
      returning: () => Promise<unknown[]>;
    };
    resultPromise.returning = async () => queue.shift() ?? [];
    return resultPromise;
  };

  return {
    selectDistinctQueue,
    updateReturningQueue,
    deleteReturningQueue,
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => createWhereChain(updateReturningQueue)),
      })),
    })),
    selectDistinct: vi.fn(() => ({
      from: vi.fn(() => ({
        where: async () => selectDistinctQueue.shift() ?? [],
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => {
        const resultPromise = Promise.resolve(undefined) as Promise<void> & {
          returning: () => Promise<unknown[]>;
        };
        resultPromise.returning = async () => deleteReturningQueue.shift() ?? [];
        return resultPromise;
      }),
    })),
    transaction: vi.fn(async (callback: (tx: MockDb) => Promise<unknown>) => callback(mockDb)),
    query: {
      businessProfiles: {
        findMany: businessFindMany,
      },
    },
  };
}

vi.mock('@/server/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/db')>();
  return {
    ...actual,
    getDbClient: () => mockDb,
  };
});

vi.mock('@/server/audit', () => ({
  createDbAuditService: () => ({
    log: auditLog,
  }),
}));

vi.mock('@/server/context', () => ({
  createRequestContext: () => ({
    actor: { kind: 'system' },
    ipAddress: null,
    requestId: 'test-cron',
  }),
}));

beforeEach(() => {
  vi.resetModules();
  mockDb = createMockDb();
  auditLog.mockClear();
});

describe('runDailyMaintenance', () => {
  test('aggregates vip and placement expirations and hides published businesses', async () => {
    mockDb.updateReturningQueue.push(
      [{ id: 'card-1' }, { id: 'card-2' }],
      [{ id: 'vip-1' }],
      [{ id: 'placement-1' }, { id: 'placement-2' }],
      [{ id: 'bus-1' }, { id: 'bus-2' }],
    );
    mockDb.selectDistinctQueue.push([{ user_id: 'user-1' }], [{ business_id: 'bus-2' }]);
    mockDb.query.businessProfiles.findMany.mockImplementation(async () => [
      { id: 'bus-1', status: 'PUBLISHED' },
      { id: 'bus-2', status: 'PUBLISHED' },
    ]);
    mockDb.deleteReturningQueue.push([{ id: 'evt-1' }, { id: 'evt-2' }, { id: 'evt-3' }]);

    const { runDailyMaintenance } = await import('../../src/server/services/maintenance-service');
    const result = await runDailyMaintenance();

    expect(result).toEqual({
      expiredCards: 2,
      expiredSubscriptions: 3,
      hiddenBusinesses: 2,
      cleanedEvents: 3,
    });
    expect(auditLog).toHaveBeenCalledTimes(2);
  });

  test('skips hide step when no expired vip users or placement businesses exist', async () => {
    mockDb.updateReturningQueue.push([{ id: 'card-1' }], [], []);
    mockDb.selectDistinctQueue.push([], []);
    mockDb.deleteReturningQueue.push([]);

    const { runDailyMaintenance } = await import('../../src/server/services/maintenance-service');
    const result = await runDailyMaintenance();

    expect(result.hiddenBusinesses).toBe(0);
    expect(mockDb.query.businessProfiles.findMany).not.toHaveBeenCalled();
  });
});
