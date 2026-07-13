import { describe, expect, test } from 'bun:test';
import type Stripe from 'stripe';

import {
  getInvoiceSubscriptionId,
  toAdminInvoiceDto,
} from '../../src/server/stripe/invoice-receipts';
import { getStripeSubscriptionPeriod } from '../../src/server/stripe/subscription-period';

const PERIOD_START = 1_783_051_200;
const PERIOD_END = 1_785_729_600;

function createInvoice(overrides: Partial<Stripe.Invoice> = {}): Stripe.Invoice {
  const invoice = {
    id: 'in_paid_vip',
    number: 'KCLUB-0001',
    amount_paid: 1_999,
    currency: 'usd',
    status: 'paid',
    period_start: PERIOD_START,
    period_end: PERIOD_END,
    invoice_pdf: 'https://pay.stripe.com/invoice/in_paid_vip/pdf',
    created: PERIOD_START,
    parent: {
      type: 'subscription_details',
      quote_details: null,
      subscription_details: {
        metadata: null,
        subscription: 'sub_vip',
      },
    },
    ...overrides,
  };

  // The fixture intentionally supplies only the Stripe fields consumed by the receipt mapper.
  return invoice as Stripe.Invoice;
}

describe('admin invoice receipts', () => {
  test('maps paid VIP invoice fields into the safe admin DTO', () => {
    const dto = toAdminInvoiceDto(createInvoice(), new Set(['sub_vip']));

    expect(dto).toEqual({
      id: 'in_paid_vip',
      number: 'KCLUB-0001',
      stripeSubscriptionId: 'sub_vip',
      amountPaid: 1_999,
      currency: 'usd',
      status: 'paid',
      periodStart: new Date(PERIOD_START * 1000).toISOString(),
      periodEnd: new Date(PERIOD_END * 1000).toISOString(),
      invoicePdf: 'https://pay.stripe.com/invoice/in_paid_vip/pdf',
      createdAt: new Date(PERIOD_START * 1000).toISOString(),
    });
    expect(dto).not.toHaveProperty('customer');
    expect(dto).not.toHaveProperty('metadata');
  });

  test('rejects unpaid and non-VIP invoices', () => {
    const allowedSubscriptionIds = new Set(['sub_vip']);

    expect(toAdminInvoiceDto(createInvoice({ status: 'open' }), allowedSubscriptionIds)).toBeNull();
    expect(
      toAdminInvoiceDto(
        createInvoice({
          parent: {
            type: 'subscription_details',
            quote_details: null,
            subscription_details: { metadata: null, subscription: 'sub_business' },
          },
        }),
        allowedSubscriptionIds,
      ),
    ).toBeNull();
  });

  test('keeps a finalized invoice without a PDF as an unavailable receipt', () => {
    const dto = toAdminInvoiceDto(createInvoice({ invoice_pdf: null }), new Set(['sub_vip']));

    expect(dto?.invoicePdf).toBeNull();
  });

  test('reads expanded subscription ids from invoice parents', () => {
    const invoice = createInvoice({
      parent: {
        type: 'subscription_details',
        quote_details: null,
        subscription_details: {
          metadata: null,
          subscription: { id: 'sub_expanded' } as Stripe.Subscription,
        },
      },
    });

    expect(getInvoiceSubscriptionId(invoice)).toBe('sub_expanded');
  });
});

describe('Stripe subscription periods', () => {
  test('maps period start and end from the first subscription item shape', () => {
    const period = getStripeSubscriptionPeriod({
      current_period_start: PERIOD_START,
      current_period_end: PERIOD_END,
    });

    expect(period).toEqual({
      currentPeriodStart: new Date(PERIOD_START * 1000),
      currentPeriodEnd: new Date(PERIOD_END * 1000),
      currentPeriodEndTimestamp: PERIOD_END,
    });
  });

  test('returns null period values when Stripe has no subscription item', () => {
    expect(getStripeSubscriptionPeriod(undefined)).toEqual({
      currentPeriodStart: null,
      currentPeriodEnd: null,
      currentPeriodEndTimestamp: null,
    });
  });
});
