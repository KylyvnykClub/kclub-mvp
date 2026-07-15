import { describe, expect, test } from 'bun:test';
import type Stripe from 'stripe';

import type { SubscriptionKind } from '@kclub/contracts';

import {
  aggregateFinanceInvoices,
  buildFinanceMonthKeys,
  financeWindowStartUnix,
} from '../../src/server/services/finance-service';

// Fixed reference point: 2026-07-15T12:00:00Z.
const NOW = new Date('2026-07-15T12:00:00.000Z');

function unix(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

function createInvoice(overrides: Partial<Stripe.Invoice> = {}): Stripe.Invoice {
  const invoice = {
    id: 'in_test',
    number: 'KCLUB-0001',
    amount_paid: 1_000,
    currency: 'usd',
    status: 'paid',
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    invoice_pdf: 'https://pay.stripe.com/invoice/in_test/pdf',
    created: unix('2026-07-01T00:00:00Z'),
    parent: {
      type: 'subscription_details',
      quote_details: null,
      subscription_details: { metadata: null, subscription: 'sub_vip' },
    },
    ...overrides,
  };

  // The fixture intentionally supplies only the Stripe fields consumed by the aggregator.
  return invoice as Stripe.Invoice;
}

function subscriptionParent(subscriptionId: string): Stripe.Invoice['parent'] {
  return {
    type: 'subscription_details',
    quote_details: null,
    subscription_details: { metadata: null, subscription: subscriptionId },
  } as Stripe.Invoice['parent'];
}

const KIND_MAP: ReadonlyMap<string, SubscriptionKind> = new Map([
  ['sub_vip', 'VIP_MEMBERSHIP'],
  ['sub_biz', 'BUSINESS_PLACEMENT'],
]);

describe('buildFinanceMonthKeys', () => {
  test('returns 12 UTC month keys oldest first, crossing the year boundary', () => {
    const keys = buildFinanceMonthKeys(NOW);

    expect(keys).toHaveLength(12);
    expect(keys[0]).toBe('2025-08');
    expect(keys[4]).toBe('2025-12');
    expect(keys[5]).toBe('2026-01');
    expect(keys[11]).toBe('2026-07');
  });

  test('window start matches the first charted month', () => {
    expect(financeWindowStartUnix(NOW)).toBe(unix('2025-08-01T00:00:00Z'));
  });
});

describe('aggregateFinanceInvoices', () => {
  test('returns zero-filled buckets and fallback currency for no invoices', () => {
    const result = aggregateFinanceInvoices([], KIND_MAP, NOW);

    expect(result.currency).toBe('usd');
    expect(result.revenue30d).toBe(0);
    expect(result.revenuePrev30d).toBe(0);
    expect(result.monthlyRevenue).toHaveLength(12);
    expect(result.monthlyRevenue.every((point) => point.total === 0)).toBe(true);
    expect(result.recentPayments).toEqual([]);
    expect(result.revenueByKind).toEqual({ vip: 0, businessPlacement: 0, other: 0 });
  });

  test('attributes revenue by subscription kind and buckets unmapped invoices as other', () => {
    const invoices = [
      createInvoice({ id: 'in_1', amount_paid: 2_000 }),
      createInvoice({ id: 'in_2', amount_paid: 3_000, parent: subscriptionParent('sub_biz') }),
      createInvoice({ id: 'in_3', amount_paid: 500, parent: subscriptionParent('sub_unknown') }),
      createInvoice({ id: 'in_4', amount_paid: 250, parent: null }),
    ];

    const result = aggregateFinanceInvoices(invoices, KIND_MAP, NOW);

    expect(result.revenueByKind).toEqual({ vip: 2_000, businessPlacement: 3_000, other: 750 });
    const july = result.monthlyRevenue.at(-1)!;
    expect(july).toEqual({
      month: '2026-07',
      vip: 2_000,
      businessPlacement: 3_000,
      other: 750,
      total: 5_750,
    });
  });

  test('buckets invoices into UTC months across the year boundary', () => {
    const invoices = [
      createInvoice({ id: 'in_dec', amount_paid: 100, created: unix('2025-12-31T23:59:59Z') }),
      createInvoice({ id: 'in_jan', amount_paid: 200, created: unix('2026-01-01T00:00:01Z') }),
    ];

    const result = aggregateFinanceInvoices(invoices, KIND_MAP, NOW);
    const december = result.monthlyRevenue.find((point) => point.month === '2025-12')!;
    const january = result.monthlyRevenue.find((point) => point.month === '2026-01')!;

    expect(december.total).toBe(100);
    expect(january.total).toBe(200);
  });

  test('computes rolling 30-day and previous-30-day revenue windows', () => {
    const invoices = [
      // 10 days ago -> current window
      createInvoice({ id: 'in_now', amount_paid: 1_000, created: unix('2026-07-05T12:00:00Z') }),
      // 45 days ago -> previous window
      createInvoice({ id: 'in_prev', amount_paid: 700, created: unix('2026-05-31T12:00:00Z') }),
      // 70 days ago -> outside both windows
      createInvoice({ id: 'in_old', amount_paid: 300, created: unix('2026-05-06T12:00:00Z') }),
    ];

    const result = aggregateFinanceInvoices(invoices, KIND_MAP, NOW);

    expect(result.revenue30d).toBe(1_000);
    expect(result.revenuePrev30d).toBe(700);
  });

  test('sums only the dominant currency but keeps foreign invoices in recent payments', () => {
    const invoices = [
      createInvoice({ id: 'in_usd_1', amount_paid: 1_000 }),
      createInvoice({ id: 'in_usd_2', amount_paid: 1_000 }),
      createInvoice({ id: 'in_eur', amount_paid: 9_999, currency: 'eur' }),
    ];

    const result = aggregateFinanceInvoices(invoices, KIND_MAP, NOW);

    expect(result.currency).toBe('usd');
    expect(result.revenueByKind.vip).toBe(2_000);
    expect(result.monthlyRevenue.at(-1)!.total).toBe(2_000);
    expect(result.recentPayments).toHaveLength(3);
    expect(result.recentPayments.find((p) => p.id === 'in_eur')?.currency).toBe('eur');
  });

  test('limits recent payments to 10 sorted newest first with customer and kind data', () => {
    const invoices = Array.from({ length: 12 }, (_, index) =>
      createInvoice({
        id: `in_${index}`,
        amount_paid: 100,
        created: unix('2026-07-01T00:00:00Z') + index * 3_600,
      }),
    );

    const result = aggregateFinanceInvoices(invoices, KIND_MAP, NOW);

    expect(result.recentPayments).toHaveLength(10);
    expect(result.recentPayments[0]!.id).toBe('in_11');
    expect(result.recentPayments.at(-1)!.id).toBe('in_2');
    expect(result.recentPayments[0]!.customerName).toBe('Test Customer');
    expect(result.recentPayments[0]!.kind).toBe('VIP_MEMBERSHIP');
  });
});
