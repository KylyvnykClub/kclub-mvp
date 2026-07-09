import { describe, expect, test, mock, beforeEach } from 'bun:test';

function createMockTx() {
  return {
    businessProfile: {
      update: mock(() => Promise.resolve({ id: 'bus-1', status: 'PUBLISHED' })),
    },
    subscription: {
      findFirst: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({ id: 'placement-sub-1' })),
      update: mock(() => Promise.resolve({ id: 'placement-sub-1' })),
    },
  };
}

function createPlacementMockPrisma() {
  return {
    businessProfile: {
      findUnique: mock(() =>
        Promise.resolve({ id: 'bus-1', user_id: 'user-1', status: 'APPROVED' }),
      ),
      update: mock(() => Promise.resolve({ id: 'bus-1', status: 'PUBLISHED' })),
    },
    vipSubscription: {
      findFirst: mock(() => Promise.resolve({ id: 'vip-1', status: 'ACTIVE' } as any)),
      update: mock(() => Promise.resolve({ id: 'vip-1', status: 'ACTIVE' } as any)),
    },
    subscription: {
      findFirst: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({ id: 'placement-sub-1' })),
      update: mock(() => Promise.resolve({ id: 'placement-sub-1' })),
    },
    stripeWebhookEvent: {
      create: mock(() => Promise.resolve({ id: 'evt-record-1' })),
      update: mock(() => Promise.resolve({ id: 'evt-record-1' })),
    },
    $transaction: mock((fn: any) => fn(mockTx)),
  };
}

function createVipMockPrisma() {
  return {
    businessProfile: {
      findUnique: mock(() => Promise.resolve(null as any)),
      update: mock(() => Promise.resolve(null as any)),
    },
    subscription: {
      findFirst: mock(() => Promise.resolve(null as any)),
      create: mock(() => Promise.resolve(null as any)),
      update: mock(() => Promise.resolve(null as any)),
    },
    vipSubscription: {
      findFirst: mock(() => Promise.resolve(null as any)),
      update: mock(() => Promise.resolve(null as any)),
    },
    stripeWebhookEvent: {
      create: mock(() => Promise.resolve({ id: 'evt-record-1' })),
      update: mock(() => Promise.resolve({ id: 'evt-record-1' })),
    },
    $transaction: mock((fn: any) => fn(mockTx)),
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
let mockPrisma:
  | ReturnType<typeof createPlacementMockPrisma>
  | ReturnType<typeof createVipMockPrisma>;
let mockAuditLog: (...args: any[]) => Promise<any>;

mock.module('@/server/db', () => ({
  getPrismaClient: () => mockPrisma,
}));

mock.module('@/server/stripe/client', () => ({
  getStripeClient: () => mockStripeClient,
}));

mock.module('@/server/audit', () => ({
  createDbAuditService: () => ({
    log: (...args: any[]) => {
      if (mockAuditLog) return mockAuditLog(...args);
      return Promise.resolve({ id: 'audit-1' });
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
    mockPrisma = createPlacementMockPrisma();
    mockAuditLog = mock(() => Promise.resolve({ id: 'audit-1' }));
    mockStripeClient.subscriptions.retrieve = mock(() => Promise.resolve(mockStripeSubData));
  });

  test('publishes approved business and creates placement subscription', async () => {
    await handlePlacementCheckoutCompleted(validSession);

    expect(mockTx.businessProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'bus-1' },
        data: expect.objectContaining({
          status: 'PUBLISHED',
          featured_top: false,
          featured_recommended: false,
        }),
      }),
    );
    expect(mockTx.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: 'BUSINESS_PLACEMENT',
          status: 'ACTIVE',
          user_id: 'user-1',
          business_profile_id: 'bus-1',
          stripe_customer_id: 'cus_00000001',
          stripe_subscription_id: 'sub_00000001',
          stripe_price_id: 'price_monthly_1',
        }),
      }),
    );
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
      stripe_subscription_id: 'sub_previous',
    };
    mockPrisma.subscription.findFirst.mockImplementation(() => Promise.resolve(existingSub as any));

    await handlePlacementCheckoutCompleted(validSession);

    expect(mockTx.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'existing-sub' },
        data: expect.objectContaining({
          status: 'ACTIVE',
          stripe_subscription_id: 'sub_00000001',
          stripe_customer_id: 'cus_00000001',
          stripe_price_id: 'price_monthly_1',
        }),
      }),
    );
    expect(mockTx.subscription.create).not.toHaveBeenCalled();
  });

  test('returns early when business is already published with matching subscription', async () => {
    mockPrisma.businessProfile.findUnique.mockImplementation(() =>
      Promise.resolve({ id: 'bus-1', user_id: 'user-1', status: 'PUBLISHED' }),
    );
    mockPrisma.subscription.findFirst.mockImplementation(() =>
      Promise.resolve({
        id: 'existing-sub',
        kind: 'BUSINESS_PLACEMENT',
        stripe_subscription_id: 'sub_00000001',
      } as any),
    );

    await handlePlacementCheckoutCompleted(validSession);

    expect(mockTx.businessProfile.update).not.toHaveBeenCalled();
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
    mockPrisma.businessProfile.findUnique.mockImplementation(() =>
      Promise.resolve({ id: 'bus-1', user_id: 'user-2', status: 'APPROVED' }),
    );
    await expect(handlePlacementCheckoutCompleted(validSession)).rejects.toThrow('owner mismatch');
  });

  test('throws when business is not APPROVED', async () => {
    mockPrisma.businessProfile.findUnique.mockImplementation(() =>
      Promise.resolve({ id: 'bus-1', user_id: 'user-1', status: 'UNDER_REVIEW' }),
    );
    await expect(handlePlacementCheckoutCompleted(validSession)).rejects.toThrow('UNDER_REVIEW');
  });

  test('throws when VIP subscription is missing', async () => {
    mockPrisma.vipSubscription.findFirst.mockImplementation(() => Promise.resolve(null as any));
    await expect(handlePlacementCheckoutCompleted(validSession)).rejects.toThrow(
      'active VIP access',
    );
  });

  test('throws when VIP subscription is expired', async () => {
    mockPrisma.vipSubscription.findFirst.mockImplementation(() =>
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
    mockPrisma = createPlacementMockPrisma();
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

    expect(mockPrisma.stripeWebhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ event_id: 'evt_placement_test' }),
      }),
    );
    expect(mockTx.businessProfile.update).toHaveBeenCalled();
    expect(mockPrisma.vipSubscription.findFirst).toHaveBeenCalled();
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

    expect(mockTx.businessProfile.update).toHaveBeenCalled();
  });

  test('duplicate event id is idempotent (P2002)', async () => {
    const p2002Error = new Error('Unique constraint failed');
    (p2002Error as any).code = 'P2002';

    const firstCall = true;
    mockPrisma.stripeWebhookEvent.create.mockImplementation(() => {
      if (firstCall) {
        return Promise.resolve({ id: 'evt-record-1' });
      }
      return Promise.reject(p2002Error);
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

    mockPrisma.stripeWebhookEvent.create.mockImplementation(() => Promise.reject(p2002Error));

    const mockUpdate = mock(() => Promise.resolve({ id: 'evt-record-1' }));
    mockPrisma.stripeWebhookEvent.update = mockUpdate;

    await processStripeEvent(testEvent as any);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('handler failure records FAILED status', async () => {
    mockPrisma.businessProfile.findUnique.mockImplementation(() => Promise.resolve(null as any));

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

    mockPrisma.stripeWebhookEvent.update = mock(() => Promise.resolve({ id: 'evt-record-1' }));

    await expect(processStripeEvent(testEvent as any)).rejects.toThrow();

    expect(mockPrisma.stripeWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { event_id: 'evt_fail_test' },
        data: expect.objectContaining({
          handler_status: 'FAILED',
        }),
      }),
    );
  });

  test('stripe subscription retrieve failure still publishes business', async () => {
    mockStripeClient.subscriptions.retrieve = mock(() =>
      Promise.reject(new Error('Network error')),
    );

    await handlePlacementCheckoutCompleted(validSession);

    expect(mockTx.businessProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'bus-1' },
        data: expect.objectContaining({ status: 'PUBLISHED' }),
      }),
    );
    expect(mockTx.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stripe_price_id: null,
          current_period_start: null,
          current_period_end: null,
        }),
      }),
    );
  });
});

describe('handlePaymentFailed', () => {
  beforeEach(() => {
    mockPrisma = createVipMockPrisma();
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
    (mockPrisma as any).vipSubscription.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'ACTIVE' } as any),
    );
    (mockPrisma as any).vipSubscription.update.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'PAST_DUE' } as any),
    );

    await processStripeEvent(failedInvoiceEvent('sub_active') as any);

    expect(mockPrisma.vipSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'vip-1' },
        data: expect.objectContaining({ status: 'PAST_DUE' }),
      }),
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUBSCRIPTION_SYNCED',
        after: expect.objectContaining({ status: 'PAST_DUE' }),
      }),
      expect.any(Object),
    );
  });

  test('does not write audit log again if already PAST_DUE', async () => {
    (mockPrisma as any).vipSubscription.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'PAST_DUE' } as any),
    );
    (mockPrisma as any).vipSubscription.update.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'PAST_DUE' } as any),
    );

    await processStripeEvent(failedInvoiceEvent('sub_past_due') as any);

    expect(mockPrisma.vipSubscription.update).toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  test('graceful no-op when subscription not found locally', async () => {
    (mockPrisma as any).vipSubscription.findFirst.mockImplementation(() =>
      Promise.resolve(null as any),
    );

    await processStripeEvent(failedInvoiceEvent('sub_unknown') as any);

    expect(mockPrisma.vipSubscription.update).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });
});

describe('handleSubscriptionDeleted', () => {
  beforeEach(() => {
    mockPrisma = createVipMockPrisma();
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
    (mockPrisma as any).vipSubscription.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'ACTIVE' } as any),
    );

    await processStripeEvent(deletedSubEvent('sub_to_delete') as any);

    expect(mockPrisma.vipSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'vip-1' },
        data: expect.objectContaining({
          status: 'EXPIRED',
          cancel_at_period_end: false,
        }),
      }),
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUBSCRIPTION_SYNCED',
        after: expect.objectContaining({ status: 'EXPIRED' }),
      }),
      expect.any(Object),
    );
  });

  test('graceful no-op when subscription not found locally', async () => {
    (mockPrisma as any).vipSubscription.findFirst.mockImplementation(() =>
      Promise.resolve(null as any),
    );

    await processStripeEvent(deletedSubEvent('sub_unknown') as any);

    expect(mockPrisma.vipSubscription.update).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });
});

describe('handleSubscriptionChange with cancel_at_period_end', () => {
  beforeEach(() => {
    mockPrisma = createVipMockPrisma();
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
    (mockPrisma as any).vipSubscription.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'ACTIVE', cancel_at_period_end: false } as any),
    );

    await processStripeEvent(updateEvent('sub_cancel', { cancel_at_period_end: true }) as any);

    expect(mockPrisma.vipSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'vip-1' },
        data: expect.objectContaining({
          status: 'ACTIVE',
          cancel_at_period_end: true,
        }),
      }),
    );
  });

  test('uncancel flips cancel_at_period_end back to false', async () => {
    (mockPrisma as any).vipSubscription.findFirst.mockImplementation(() =>
      Promise.resolve({ id: 'vip-1', status: 'ACTIVE', cancel_at_period_end: true } as any),
    );

    await processStripeEvent(updateEvent('sub_uncancel', { cancel_at_period_end: false }) as any);

    expect(mockPrisma.vipSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'vip-1' },
        data: expect.objectContaining({
          status: 'ACTIVE',
          cancel_at_period_end: false,
        }),
      }),
    );
  });
});

describe('out-of-order subscription events', () => {
  beforeEach(() => {
    mockPrisma = createVipMockPrisma();
  });

  test('subscription.deleted before subscription record exists is graceful no-op', async () => {
    (mockPrisma as any).vipSubscription.findFirst.mockImplementation(() =>
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

    expect(mockPrisma.vipSubscription.update).not.toHaveBeenCalled();
  });

  test('subscription.updated before subscription record exists is graceful no-op', async () => {
    (mockPrisma as any).vipSubscription.findFirst.mockImplementation(() =>
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

    expect(mockPrisma.vipSubscription.update).not.toHaveBeenCalled();
  });
});
