import { describe, expect, mock, test } from 'bun:test';

import type { RequestContext } from '../../src/server/context';

const realDb = await import('../../src/server/db');

const USER_ID = '721cf27f-05b7-47f1-b3f0-483a961d6ed8';
const PERIOD_START = 1_783_051_200;
const PERIOD_END = 1_785_729_600;
const user = {
  id: USER_ID,
  phone: '+15551234567',
  display_name: 'Member',
  status: 'ACTIVE',
  membership_tier: 'MEMBER',
  created_at: new Date('2026-06-01T00:00:00.000Z'),
  locale_preference: 'en',
  terms_accepted_at: new Date('2026-06-01T00:00:00.000Z'),
  updated_at: new Date('2026-06-01T00:00:00.000Z'),
  country: null,
  city: null,
  about: null,
  avatar_url: null,
};
const existingSubscription = {
  id: '11111111-1111-4111-8111-111111111111',
  user_id: USER_ID,
  status: 'ACTIVE',
  stripe_customer_id: 'cus_vip',
  stripe_subscription_id: 'sub_vip',
  current_period_start: null,
  current_period_end: null,
  cancel_at_period_end: false,
  created_at: new Date('2026-06-01T00:00:00.000Z'),
  updated_at: new Date('2026-06-01T00:00:00.000Z'),
};

let syncedSubscription = existingSubscription;
let subscriptionUpdate: Record<string, unknown> | null = null;

const db = {
  query: {
    users: { findFirst: mock(async () => user) },
    vipSubscriptions: {
      findFirst: mock(async () => existingSubscription),
      findMany: mock(async () => [syncedSubscription]),
    },
    memberCards: { findMany: mock(async () => []) },
    auditLogs: { findMany: mock(async () => []) },
  },
  update: mock((table: unknown) => ({
    set: (values: Record<string, unknown>) => {
      if (table === realDb.schema.vipSubscriptions) {
        subscriptionUpdate = values;
        syncedSubscription = { ...existingSubscription, ...values };
      }

      return {
        where: () => ({
          returning: async () => [syncedSubscription],
        }),
      };
    },
  })),
};

mock.module('@/server/db', () => ({
  ...realDb,
  getDbClient: () => db,
}));

mock.module('@/server/audit', () => ({
  createDbAuditService: () => ({
    log: mock(async () => ({ id: 'audit-1' })),
  }),
}));

mock.module('@/server/stripe/client', () => ({
  getStripeClient: () => ({
    subscriptions: {
      retrieve: mock(async () => ({
        id: 'sub_vip',
        status: 'active',
        customer: 'cus_vip',
        cancel_at_period_end: false,
        items: {
          data: [
            {
              current_period_start: PERIOD_START,
              current_period_end: PERIOD_END,
            },
          ],
        },
      })),
    },
  }),
}));

mock.module('next/cache', () => ({
  revalidateTag: mock(() => undefined),
}));

const { syncVipSubscriptionForUser } = await import('../../src/server/services/admin-service');

describe('syncVipSubscriptionForUser', () => {
  test('persists and returns both period dates from the Stripe subscription item', async () => {
    const context: RequestContext = {
      actor: { kind: 'staff', staffId: 'staff-admin', role: 'ADMIN' },
      ipAddress: null,
      userAgent: null,
      locale: null,
      requestId: 'request-sync-vip',
    };

    const result = await syncVipSubscriptionForUser(USER_ID, context);

    expect(subscriptionUpdate).toMatchObject({
      current_period_start: new Date(PERIOD_START * 1000),
      current_period_end: new Date(PERIOD_END * 1000),
    });
    expect(result.subscriptions[0]?.currentPeriodStart).toBe(
      new Date(PERIOD_START * 1000).toISOString(),
    );
    expect(result.subscriptions[0]?.currentPeriodEnd).toBe(
      new Date(PERIOD_END * 1000).toISOString(),
    );
  });
});
