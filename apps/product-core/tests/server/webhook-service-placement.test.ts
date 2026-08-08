import { beforeEach, describe, expect, test, vi } from 'vitest';

type MockDb = ReturnType<typeof createMockDb>;

const revalidateTag = vi.fn();
const auditLog = vi.fn(() => Promise.resolve({ id: 'audit-1' }));
const stripeRetrieve = vi.fn(() =>
  Promise.resolve({
    id: 'sub_placement_1',
    customer: 'cus_placement_1',
    cancel_at_period_end: false,
    items: {
      data: [
        {
          current_period_start: 1_740_000_000,
          current_period_end: 1_742_592_000,
          price: { id: 'price_placement_monthly' },
        },
      ],
    },
  }),
);

let mockDb: MockDb;

function createMockDb() {
  const selectQueue: unknown[][] = [];
  const selectDistinctQueue: unknown[][] = [];
  const updateReturningQueue: unknown[][] = [];
  const deleteReturningQueue: unknown[][] = [];
  const insertCalls: Array<{ table: unknown; values: unknown }> = [];
  const updateCalls: Array<{ table: unknown; values: unknown }> = [];

  const nextQueueValue = <T>(queue: T[][]): T[] => queue.shift() ?? [];

  const createWhereChain = (queue: unknown[][]) => {
    const resultPromise = Promise.resolve(undefined) as Promise<void> & {
      returning: () => Promise<unknown[]>;
    };
    resultPromise.returning = async () => nextQueueValue(queue);
    return resultPromise;
  };

  return {
    selectQueue,
    selectDistinctQueue,
    updateReturningQueue,
    deleteReturningQueue,
    insertCalls,
    updateCalls,
    insert: vi.fn((table: unknown) => ({
      values: async (values: unknown) => {
        insertCalls.push({ table, values });

        if (
          typeof values === 'object' &&
          values !== null &&
          'event_id' in values &&
          selectQueue[0]?.[0] === '__DUPLICATE__'
        ) {
          selectQueue.shift();
          const error = new Error('duplicate');
          (error as Error & { code: string }).code = '23505';
          throw error;
        }

        return [];
      },
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: async () => nextQueueValue(selectQueue),
          })),
          limit: async () => nextQueueValue(selectQueue),
        })),
      })),
    })),
    selectDistinct: vi.fn(() => ({
      from: vi.fn(() => ({
        where: async () => nextQueueValue(selectDistinctQueue),
      })),
    })),
    update: vi.fn((table: unknown) => ({
      set: vi.fn((values: unknown) => {
        updateCalls.push({ table, values });
        return {
          where: vi.fn(() => createWhereChain(updateReturningQueue)),
        };
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => {
        const resultPromise = Promise.resolve(undefined) as Promise<void> & {
          returning: () => Promise<unknown[]>;
        };
        resultPromise.returning = async () => nextQueueValue(deleteReturningQueue);
        return resultPromise;
      }),
    })),
    transaction: vi.fn(async (callback: (tx: MockDb) => Promise<unknown>) => callback(mockDb)),
    query: {
      businessProfiles: {
        findMany: vi.fn(async () => nextQueueValue(selectQueue)),
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

vi.mock('@/server/stripe/client', () => ({
  getStripeClient: () => ({
    subscriptions: {
      retrieve: stripeRetrieve,
    },
  }),
}));

vi.mock('@/server/audit', () => ({
  createDbAuditService: () => ({
    log: auditLog,
  }),
}));

vi.mock('@/server/context', () => ({
  createRequestContext: () => ({
    actor: { kind: 'system' },
    ipAddress: null,
    requestId: 'test-request',
  }),
}));

vi.mock('next/cache', () => ({
  revalidateTag,
}));

const businessPlacementEvent = {
  id: 'evt_placement_1',
  type: 'checkout.session.completed' as const,
  livemode: false,
  data: {
    object: {
      id: 'cs_placement_1',
      customer: 'cus_placement_1',
      subscription: 'sub_placement_1',
      metadata: {
        type: 'business_placement',
        userId: 'user-1',
        businessId: 'bus-1',
      },
    },
  },
};

beforeEach(() => {
  vi.resetModules();
  mockDb = createMockDb();
  revalidateTag.mockReset();
  auditLog.mockClear();
  stripeRetrieve.mockClear();
});

describe('processStripeEvent placement lifecycle', () => {
  test('records first delivery as processing and finishes as processed', async () => {
    mockDb.selectQueue.push(
      [{ id: 'bus-1', user_id: 'user-1', status: 'APPROVED' }],
      [{ id: 'vip-1', status: 'ACTIVE' }],
      [],
    );

    const { processStripeEvent } = await import('../../src/server/services/webhook-service');
    await processStripeEvent(businessPlacementEvent as any);

    expect(mockDb.insertCalls[0]?.values).toMatchObject({
      event_id: 'evt_placement_1',
      handler_status: 'PROCESSING',
    });
    expect(mockDb.insertCalls[1]?.values).toMatchObject({
      kind: 'BUSINESS_PLACEMENT',
      status: 'ACTIVE',
      business_profile_id: 'bus-1',
      stripe_subscription_id: 'sub_placement_1',
    });
    expect(mockDb.updateCalls.at(-1)?.values).toMatchObject({
      handler_status: 'PROCESSED',
      error_message: null,
    });
    expect(revalidateTag).toHaveBeenCalledWith('businesses');
    expect(revalidateTag).toHaveBeenCalledWith('public-businesses');
  });

  test('ignores duplicates that were already processed', async () => {
    mockDb.selectQueue.push(
      ['__DUPLICATE__' as unknown as never],
      [{ event_id: 'evt_placement_1', handler_status: 'PROCESSED' }],
    );

    const { processStripeEvent } = await import('../../src/server/services/webhook-service');
    await processStripeEvent(businessPlacementEvent as any);

    expect(mockDb.insertCalls).toHaveLength(1);
    expect(mockDb.updateCalls).toHaveLength(0);
  });

  test('reclaims failed events and retries them', async () => {
    mockDb.selectQueue.push(
      ['__DUPLICATE__' as unknown as never],
      [{ event_id: 'evt_placement_1', handler_status: 'FAILED' }],
      [{ id: 'bus-1', user_id: 'user-1', status: 'APPROVED' }],
      [{ id: 'vip-1', status: 'ACTIVE' }],
      [],
    );
    mockDb.updateReturningQueue.push([{ event_id: 'evt_placement_1' }]);

    const { processStripeEvent } = await import('../../src/server/services/webhook-service');
    await processStripeEvent(businessPlacementEvent as any);

    expect(mockDb.updateCalls[0]?.values).toMatchObject({
      handler_status: 'PROCESSING',
      error_message: null,
    });
    expect(mockDb.updateCalls.at(-1)?.values).toMatchObject({
      handler_status: 'PROCESSED',
    });
  });

  test('marks failed webhook attempts as failed', async () => {
    mockDb.selectQueue.push([], [{ id: 'vip-1', status: 'ACTIVE' }], []);

    const { processStripeEvent } = await import('../../src/server/services/webhook-service');
    await expect(processStripeEvent(businessPlacementEvent as any)).rejects.toThrow(
      'Business not found',
    );

    expect(mockDb.updateCalls.at(-1)?.values).toMatchObject({
      handler_status: 'FAILED',
      error_message: 'Business not found for placement checkout',
    });
  });

  test('maps placement payment failures to PAST_DUE', async () => {
    mockDb.selectQueue.push(
      [],
      [
        {
          id: 'sub-local-1',
          kind: 'BUSINESS_PLACEMENT',
          status: 'ACTIVE',
          business_profile_id: 'bus-1',
        },
      ],
      [
        {
          id: 'sub-local-1',
          kind: 'BUSINESS_PLACEMENT',
          status: 'ACTIVE',
          business_profile_id: 'bus-1',
        },
      ],
    );

    const { processStripeEvent } = await import('../../src/server/services/webhook-service');
    await processStripeEvent({
      id: 'evt_invoice_failed_1',
      type: 'invoice.payment_failed',
      livemode: false,
      data: { object: { subscription: 'sub_placement_1' } },
    } as any);

    expect(
      mockDb.updateCalls.some((call) => (call.values as { status?: string }).status === 'PAST_DUE'),
    ).toBe(true);
    expect(auditLog).toHaveBeenCalled();
  });

  test('expires placement subscriptions and hides published businesses', async () => {
    mockDb.selectQueue.push(
      [],
      [
        {
          id: 'sub-local-1',
          kind: 'BUSINESS_PLACEMENT',
          status: 'ACTIVE',
          business_profile_id: 'bus-1',
        },
      ],
      [
        {
          id: 'sub-local-1',
          kind: 'BUSINESS_PLACEMENT',
          status: 'ACTIVE',
          business_profile_id: 'bus-1',
        },
      ],
      [{ id: 'bus-1', status: 'PUBLISHED', featured_top: true, featured_recommended: true }],
    );

    const { processStripeEvent } = await import('../../src/server/services/webhook-service');
    await processStripeEvent({
      id: 'evt_subscription_deleted_1',
      type: 'customer.subscription.deleted',
      livemode: false,
      data: {
        object: {
          id: 'sub_placement_1',
          status: 'canceled',
          current_period_end: null,
        },
      },
    } as any);

    expect(
      mockDb.updateCalls.some((call) => (call.values as { status?: string }).status === 'EXPIRED'),
    ).toBe(true);
    expect(
      mockDb.updateCalls.some(
        (call) =>
          (call.values as { status?: string; featured_top?: boolean }).status === 'HIDDEN' &&
          (call.values as { featured_top?: boolean }).featured_top === false,
      ),
    ).toBe(true);
  });
});
