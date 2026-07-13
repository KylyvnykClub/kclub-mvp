import { beforeEach, describe, expect, mock, test } from 'bun:test';

import type { AdminInvoiceDto } from '@kclub/contracts';

const realDb = await import('../../src/server/db');
const USER_ID = '721cf27f-05b7-47f1-b3f0-483a961d6ed8';

let userResult: { id: string } | null;
let subscriptionResults: Array<{
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}>;

const listPaidVipInvoicesMock = mock(async (): Promise<AdminInvoiceDto[]> => [
  {
    id: 'in_1',
    number: 'KCLUB-0001',
    stripeSubscriptionId: 'sub_vip',
    amountPaid: 1_999,
    currency: 'usd',
    status: 'paid',
    periodStart: null,
    periodEnd: null,
    invoicePdf: 'https://pay.stripe.com/invoice/in_1/pdf',
    createdAt: '2026-07-01T00:00:00.000Z',
  },
]);

mock.module('@/server/db', () => ({
  ...realDb,
  getDbClient: () => ({
    query: {
      users: {
        findFirst: mock(async () => userResult),
      },
      vipSubscriptions: {
        findMany: mock(async () => subscriptionResults),
      },
    },
  }),
}));

mock.module('@/server/stripe/invoice-receipts', () => ({
  listPaidVipInvoices: listPaidVipInvoicesMock,
}));

const { listUserInvoices } = await import('../../src/server/services/admin-service');

describe('listUserInvoices', () => {
  beforeEach(() => {
    userResult = { id: USER_ID };
    subscriptionResults = [];
    listPaidVipInvoicesMock.mockClear();
  });

  test('returns an empty list without a Stripe customer or VIP subscription id', async () => {
    const invoices = await listUserInvoices(USER_ID);

    expect(invoices).toEqual([]);
    expect(listPaidVipInvoicesMock).not.toHaveBeenCalled();
  });

  test('requests receipts only for local VIP subscription ids', async () => {
    subscriptionResults = [
      { stripe_customer_id: 'cus_vip', stripe_subscription_id: 'sub_vip' },
      { stripe_customer_id: 'cus_vip', stripe_subscription_id: null },
    ];

    const invoices = await listUserInvoices(USER_ID);

    expect(invoices).toHaveLength(1);
    expect(listPaidVipInvoicesMock).toHaveBeenCalledWith('cus_vip', ['sub_vip']);
  });

  test('throws when the user does not exist', async () => {
    userResult = null;

    expect(listUserInvoices(USER_ID)).rejects.toThrow('User not found');
  });
});
