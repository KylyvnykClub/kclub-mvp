import { describe, expect, test, mock, beforeEach } from 'bun:test';

mock.module('server-only', () => ({}));

function createMockTx() {
  return {
    update: mock((table: any) => {
      const chain: any = {
        set: mock(() => chain),
        where: mock(() => chain),
        returning: mock(() => Promise.resolve([{ id: 'bus-1', status: 'PUBLISHED' }])),
      };
      return chain;
    }),
    insert: mock((table: any) => {
      const chain: any = {
        values: mock(() => chain),
        returning: mock(() => Promise.resolve([{ id: 'placement-sub-1' }])),
      };
      return chain;
    }),
  };
}

function createPlacementMockDb() {
  const createUpdateChain = (returns: any) => {
    const chain: any = {
      set: mock(() => chain),
      where: mock(() => chain),
      returning: mock(() => Promise.resolve([returns])),
    };
    return chain;
  };
  const createInsertChain = (returns: any) => {
    const chain: any = {
      values: mock(() => chain),
      returning: mock(() => Promise.resolve([returns])),
    };
    return chain;
  };

  return {
    query: {
      businessProfiles: {
        findFirst: mock(() => Promise.resolve({ id: 'bus-1', userId: 'user-1', status: 'APPROVED' })),
      },
      vipSubscriptions: {
        findFirst: mock(() => Promise.resolve({ id: 'vip-1', status: 'ACTIVE' } as any)),
      },
      subscriptions: {
        findFirst: mock(() => Promise.resolve(null)),
      },
      stripeWebhookEvents: {
        findFirst: mock(() => Promise.resolve(null)),
      },
    },
    update: mock((table: any) => {
      if (table.name === 'business_profiles') return createUpdateChain({ id: 'bus-1', status: 'PUBLISHED' });
      if (table.name === 'vip_subscriptions') return createUpdateChain({ id: 'vip-1', status: 'ACTIVE' });
      if (table.name === 'subscriptions') return createUpdateChain({ id: 'placement-sub-1' });
      return createUpdateChain({ id: 'evt-record-1' });
    }),
    insert: mock(() => createInsertChain({ id: 'evt-record-1' })),
    transaction: mock(async (fn: any) => fn(mockTx)),
  };
}

function createVipMockDb() {
  const createUpdateChain = (returns: any) => {
    const chain: any = {
      set: mock(() => chain),
      where: mock(() => chain),
      returning: mock(() => Promise.resolve([returns])),
    };
    return chain;
  };
  const createInsertChain = (returns: any) => {
    const chain: any = {
      values: mock(() => chain),
      returning: mock(() => Promise.resolve([returns])),
    };
    return chain;
  };

  return {
    query: {
      businessProfiles: {
        findFirst: mock(() => Promise.resolve(null as any)),
      },
      vipSubscriptions: {
        findFirst: mock(() => Promise.resolve(null as any)),
      },
      subscriptions: {
        findFirst: mock(() => Promise.resolve(null as any)),
      },
      stripeWebhookEvents: {
        findFirst: mock(() => Promise.resolve(null as any)),
      },
    },
    update: mock(() => createUpdateChain(null)),
    insert: mock(() => createInsertChain({ id: 'evt-record-1' })),
    transaction: mock(async (fn: any) => fn(mockTx)),
  };
}

const mockStripeSubData = {
  id: 'sub_00000001',
  items: { data: [{ price: { id: 'price_monthly_1' } }] },
  current_period_start: 1740000000,
  current_period_end: 1742592000,
  cancel_at_period_end: false,
};

const mockStripeClient = {
  subscriptions: {
    retrieve: mock(() => Promise.resolve(mockStripeSubData)),
  },
};

let mockTx: ReturnType<typeof createMockTx>;
let mockDb:
  | ReturnType<typeof createPlacementMockDb>
  | ReturnType<typeof createVipMockDb>;
let mockAuditLog: (...args: any[]) => Promise<any>;

// @ts-ignore
Object.defineProperty(globalThis, 'auditLogMockForBun', {
  get: () => mockAuditLog,
  configurable: true
});

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
  getPrismaClient: () => ({}),
  schema: {
    businessProfiles: { name: 'business_profiles', id: 'id' },
    subscriptions: { name: 'subscriptions', id: 'id' },
    vipSubscriptions: { name: 'vip_subscriptions', id: 'id' },
    stripeWebhookEvents: { name: 'stripe_webhook_events', eventId: 'event_id' },
    users: { name: 'users', id: 'id' },
  },
}));

mock.module('@/server/stripe/client', () => ({
  getStripeClient: () => {
    // @ts-ignore
    if (globalThis.stripeMockForBun) return globalThis.stripeMockForBun;
    return mockStripeClient;
  },
}));

mock.module('@/server/audit', () => ({
  createDbAuditService: () => ({
    log: (...args: any[]) => {
      // @ts-ignore
      if (globalThis.auditLogMockForBun) return globalThis.auditLogMockForBun(...args);
      return mockAuditLog(...args);
    },
  }),
}));

mock.module('@/server/context', () => ({
  createRequestContext: () => ({
    actor: { kind: 'system' },
    ipAddress: null,
    requestId: 'test-request',
  }),
}));

mock.module('next/cache', () => ({
  revalidateTag: mock(),
  revalidatePath: mock(),
}));

const { handlePlacementCheckoutCompleted, processStripeEvent } =
  await import('../../src/server/services/webhook-service');

const validSession = {
  id: 'cs_00000001',
  object: 'checkout.session',
  mode: 'subscription',
  customer: 'cus_00000001',
  subscription: 'sub_00000001',
  metadata: {
    type: 'business_placement',
    userId: 'user-1',
    businessId: 'bus-1',
  },
  payment_status: 'paid',
  status: 'complete',
};

describe('handlePlacementCheckoutCompleted', () => {
  beforeEach(() => {
    mockTx = createMockTx();
    mockDb = createPlacementMockDb();
    mockAuditLog = mock(() => Promise.resolve({ id: 'audit-1' }));
    mockStripeClient.subscriptions.retrieve = mock(() => Promise.resolve(mockStripeSubData));
  });

  test('publishes approved business and creates placement subscription', async () => {
    await handlePlacementCheckoutCompleted(validSession);

    expect(mockTx.update).toHaveBeenCalled();
    expect(mockTx.insert).toHaveBeenCalled();
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BUSINESS_PUBLISHED',
        entityType: 'BusinessProfile',
        entityId: 'bus-1',
      }),
      expect.any(Object),
    );
  });

  test('updates existing placement subscription instead of creating new one', async () => {
    const existingSub = {
      id: 'existing-sub',
      kind: 'BUSINESS_PLACEMENT' as const,
      stripeSubscriptionId: 'sub_previous',
    };
    mockDb.query.subscriptions.findFirst.mockImplementation(() => Promise.resolve(existingSub as any));

    await handlePlacementCheckoutCompleted(validSession);

    expect(mockTx.update).toHaveBeenCalled();
    expect(mockTx.insert).not.toHaveBeenCalled();
  });

  test('returns early when business is already published with matching subscription', async () => {
    mockDb.query.businessProfiles.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'bus-1', userId: 'user-1', status: 'PUBLISHED' }),
    );
    mockDb.query.subscriptions.findFirst.mockImplementation(() =>
      Promise.resolve({
        id: 'existing-sub',
        kind: 'BUSINESS_PLACEMENT',
        stripeSubscriptionId: 'sub_00000001',
      } as any),
    );

    await handlePlacementCheckoutCompleted(validSession);

    expect(mockTx.update).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  test('throws when metadata is missing userId', async () => {
    const badSession = {
      ...validSession,
      metadata: { type: 'business_placement', businessId: 'bus-1' },
    };
    await expect(handlePlacementCheckoutCompleted(badSession)).rejects.toThrow('missing userId');
  });

  test('throws when metadata is missing businessId', async () => {
    const badSession = {
      ...validSession,
      metadata: { type: 'business_placement', userId: 'user-1' },
    };
    await expect(handlePlacementCheckoutCompleted(badSession)).rejects.toThrow(
      'missing userId or businessId',
    );
  });

  test('throws when subscription id is missing', async () => {
    const badSession = { ...validSession, subscription: null };
    await expect(handlePlacementCheckoutCompleted(badSession)).rejects.toThrow(
      'missing subscription id',
    );
  });

  test('throws when customer id is missing', async () => {
    const badSession = { ...validSession, customer: null };
    await expect(handlePlacementCheckoutCompleted(badSession)).rejects.toThrow(
      'missing customer id',
    );
  });

  test('throws when business owner does not match', async () => {
    mockDb.query.businessProfiles.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'bus-1', userId: 'user-2', status: 'APPROVED' }),
    );
    await expect(handlePlacementCheckoutCompleted(validSession)).rejects.toThrow('owner mismatch');
  });

  test('throws when business is not APPROVED', async () => {
    mockDb.query.businessProfiles.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'bus-1', userId: 'user-1', status: 'UNDER_REVIEW' }),
    );
    await expect(handlePlacementCheckoutCompleted(validSession)).rejects.toThrow('UNDER_REVIEW');
  });

  test('throws when VIP subscription is missing', async () => {
    mockDb.query.vipSubscriptions.findFirst.mockImplementation(() => Promise.resolve(null as any));
    await expect(handlePlacementCheckoutCompleted(validSession)).rejects.toThrow(
      'active VIP access',
    );
  });

  test('throws when VIP subscription is expired', async () => {
    mockDb.query.vipSubscriptions.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'EXPIRED' }),
    );
    await expect(handlePlacementCheckoutCompleted(validSession)).rejects.toThrow(
      'active VIP access',
    );
  });
});

describe('processStripeEvent placement routing', () => {
  beforeEach(() => {
    mockTx = createMockTx();
    mockDb = createPlacementMockDb();
    mockAuditLog = mock(() => Promise.resolve({ id: 'audit-1' }));
    mockStripeClient.subscriptions.retrieve = mock(() => Promise.resolve(mockStripeSubData));
  });

  test('routes business_placement checkout to placement handler and writes event record', async () => {
    const testEvent = {
      id: 'evt_placement_test',
      type: 'checkout.session.completed' as const,
      data: {
        object: {
          id: 'cs_test',
          object: 'checkout.session',
          mode: 'subscription',
          customer: 'cus_test',
          subscription: 'sub_test',
          metadata: {
            type: 'business_placement',
            userId: 'user-1',
            businessId: 'bus-1',
          },
          payment_status: 'paid',
          status: 'complete',
        },
      },
      livemode: false,
    };

    await processStripeEvent(testEvent as any);

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockTx.update).toHaveBeenCalled();
    expect(mockDb.query.vipSubscriptions.findFirst).toHaveBeenCalled();
  });

  test('does not write vip_subscriptions for business_placement events', async () => {
    const testEvent = {
      id: 'evt_placement_no_vip',
      type: 'checkout.session.completed' as const,
      data: {
        object: {
          id: 'cs_test2',
          object: 'checkout.session',
          mode: 'subscription',
          customer: 'cus_test',
          subscription: 'sub_test',
          metadata: {
            type: 'business_placement',
            userId: 'user-1',
            businessId: 'bus-1',
          },
          payment_status: 'paid',
          status: 'complete',
        },
      },
      livemode: false,
    };

    await processStripeEvent(testEvent as any);

    expect(mockTx.update).toHaveBeenCalled();
  });

  test('duplicate event id is idempotent (23505)', async () => {
    const p2002Error = new Error('Unique constraint failed');
    (p2002Error as any).code = '23505';

    let firstCall = true;
    mockDb.insert.mockImplementation(() => {
      if (firstCall) {
        firstCall = false;
        return {
          values: () => Promise.resolve([{ id: 'evt-record-1' }])
        };
      }
      return {
        values: () => Promise.reject(p2002Error)
      };
    });

    const testEvent = {
      id: 'evt_dup_test',
      type: 'checkout.session.completed' as const,
      data: {
        object: {
          id: 'cs_dup',
          object: 'checkout.session',
          mode: 'subscription',
          customer: 'cus_test',
          subscription: 'sub_test',
          metadata: {
            type: 'business_placement',
            userId: 'user-1',
            businessId: 'bus-1',
          },
          payment_status: 'paid',
          status: 'complete',
        },
      },
      livemode: false,
    };

    await processStripeEvent(testEvent as any);

    mockDb.insert.mockImplementation(() => ({
      values: () => Promise.reject(p2002Error)
    }));

    const mockUpdate = mock(() => Promise.resolve({ id: 'evt-record-1' }));
    mockDb.update = mockUpdate;

    await processStripeEvent(testEvent as any);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('handler failure records FAILED status', async () => {
    mockDb.query.businessProfiles.findFirst.mockImplementation(() => Promise.resolve(null as any));

    const testEvent = {
      id: 'evt_fail_test',
      type: 'checkout.session.completed' as const,
      data: {
        object: {
          id: 'cs_fail',
          object: 'checkout.session',
          mode: 'subscription',
          customer: 'cus_test',
          subscription: 'sub_test',
          metadata: {
            type: 'business_placement',
            userId: 'user-1',
            businessId: 'bus-1',
          },
          payment_status: 'paid',
          status: 'complete',
        },
      },
      livemode: false,
    };

    mockDb.update = mock(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([{ id: 'evt-record-1' }])
        })
      })
    }));

    await expect(processStripeEvent(testEvent as any)).rejects.toThrow();

    expect(mockDb.update).toHaveBeenCalled();
  });

  test('stripe subscription retrieve failure still publishes business', async () => {
    mockStripeClient.subscriptions.retrieve = mock(() =>
      Promise.reject(new Error('Network error')),
    );

    await handlePlacementCheckoutCompleted(validSession);

    expect(mockTx.update).toHaveBeenCalled();
    expect(mockTx.insert).toHaveBeenCalled();
  });
});

describe('handlePaymentFailed', () => {
  beforeEach(() => {
    mockDb = createVipMockDb();
    mockAuditLog = mock(() => Promise.resolve({ id: 'audit-1' }));
  });

  const failedInvoiceEvent = (subId: string) => ({
    id: `evt_inv_${subId}`,
    type: 'invoice.payment_failed' as const,
    data: {
      object: {
        id: `in_${subId}`,
        object: 'invoice',
        subscription: subId,
        amount_due: 2999,
        amount_paid: 0,
        currency: 'usd',
      },
    },
    livemode: false,
  });

  test('maps invoice.payment_failed to PAST_DUE and writes audit log', async () => {
    mockDb.query.vipSubscriptions.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'ACTIVE' } as any),
    );

    await processStripeEvent(failedInvoiceEvent('sub_active') as any);

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUBSCRIPTION_SYNCED',
        after: expect.objectContaining({ status: 'PAST_DUE' }),
      }),
      expect.any(Object),
    );
  });

  test('does not write audit log again if already PAST_DUE', async () => {
    mockDb.query.vipSubscriptions.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'PAST_DUE' } as any),
    );

    await processStripeEvent(failedInvoiceEvent('sub_past_due') as any);

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  test('graceful no-op when subscription not found locally', async () => {
    mockDb.query.vipSubscriptions.findFirst.mockImplementation(() =>
      Promise.resolve(null as any),
    );

    await processStripeEvent(failedInvoiceEvent('sub_unknown') as any);

    expect(mockAuditLog).not.toHaveBeenCalled();
  });
});

describe('handleSubscriptionDeleted', () => {
  beforeEach(() => {
    mockDb = createVipMockDb();
    mockAuditLog = mock(() => Promise.resolve({ id: 'audit-1' }));
  });

  const deletedSubEvent = (subId: string) => ({
    id: `evt_del_${subId}`,
    type: 'customer.subscription.deleted' as const,
    data: {
      object: {
        id: subId,
        object: 'subscription',
        status: 'canceled',
      },
    },
    livemode: false,
  });

  test('sets status to EXPIRED with expires_at and writes audit log', async () => {
    mockDb.query.vipSubscriptions.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'ACTIVE' } as any),
    );

    await processStripeEvent(deletedSubEvent('sub_to_delete') as any);

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUBSCRIPTION_SYNCED',
        after: expect.objectContaining({ status: 'EXPIRED' }),
      }),
      expect.any(Object),
    );
  });

  test('graceful no-op when subscription not found locally', async () => {
    mockDb.query.vipSubscriptions.findFirst.mockImplementation(() =>
      Promise.resolve(null as any),
    );

    await processStripeEvent(deletedSubEvent('sub_unknown') as any);

    expect(mockAuditLog).not.toHaveBeenCalled();
  });
});

describe('handleSubscriptionChange with cancel_at_period_end', () => {
  beforeEach(() => {
    mockDb = createVipMockDb();
    mockAuditLog = mock(() => Promise.resolve({ id: 'audit-1' }));
  });

  const updateEvent = (subId: string, overrides: Record<string, unknown> = {}) => ({
    id: `evt_upd_${subId}`,
    type: 'customer.subscription.updated' as const,
    data: {
      object: {
        id: subId,
        object: 'subscription',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
        cancel_at_period_end: false,
        ...overrides,
      },
    },
    livemode: false,
  });

  test('cancel_at_period_end true updates field, status stays ACTIVE', async () => {
    mockDb.query.vipSubscriptions.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'ACTIVE', cancelAtPeriodEnd: false } as any),
    );

    await processStripeEvent(updateEvent('sub_cancel', { cancel_at_period_end: true }) as any);

    expect(mockDb.update).toHaveBeenCalled();
  });

  test('uncancel flips cancel_at_period_end back to false', async () => {
    mockDb.query.vipSubscriptions.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'ACTIVE', cancelAtPeriodEnd: true } as any),
    );

    await processStripeEvent(updateEvent('sub_uncancel', { cancel_at_period_end: false }) as any);

    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe('out-of-order subscription events', () => {
  beforeEach(() => {
    mockDb = createVipMockDb();
  });

  test('subscription.deleted before subscription record exists is graceful no-op', async () => {
    mockDb.query.vipSubscriptions.findFirst.mockImplementation(() =>
      Promise.resolve(null as any),
    );

    const event = {
      id: 'evt_ooo_del',
      type: 'customer.subscription.deleted' as const,
      data: {
        object: {
          id: 'sub_never_created',
          object: 'subscription',
          status: 'canceled',
        },
      },
      livemode: false,
    };

    await processStripeEvent(event as any);
  });

  test('subscription.updated before subscription record exists is graceful no-op', async () => {
    mockDb.query.vipSubscriptions.findFirst.mockImplementation(() =>
      Promise.resolve(null as any),
    );

    const event = {
      id: 'evt_ooo_upd',
      type: 'customer.subscription.updated' as const,
      data: {
        object: {
          id: 'sub_never_created',
          object: 'subscription',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
          cancel_at_period_end: false,
        },
      },
      livemode: false,
    };

    await processStripeEvent(event as any);
  });
});
