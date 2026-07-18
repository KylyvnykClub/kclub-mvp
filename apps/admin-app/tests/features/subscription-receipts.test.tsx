import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import type { AdminInvoiceDto } from '@kclub/contracts';

import {
  SubscriptionReceipts,
  shouldLoadSubscriptionReceipts,
} from '../../src/features/users/components/subscription-receipts';

const INVOICE_PDF = 'https://pay.stripe.com/invoice/in_paid_vip/pdf';
const INVOICE: AdminInvoiceDto = {
  id: 'in_paid_vip',
  number: 'KCLUB-0001',
  stripeSubscriptionId: 'sub_vip',
  amountPaid: 1_999,
  currency: 'usd',
  status: 'paid',
  periodStart: '2026-07-01T00:00:00.000Z',
  periodEnd: '2026-08-01T00:00:00.000Z',
  invoicePdf: INVOICE_PDF,
  createdAt: '2026-07-01T00:00:00.000Z',
};

function onRetry(): void {}

describe('SubscriptionReceipts', () => {
  test('renders a safe PDF download link and invoice metadata', () => {
    const markup = renderToStaticMarkup(
      <SubscriptionReceipts invoices={[INVOICE]} status="success" error={null} onRetry={onRetry} />,
    );

    expect(markup).toContain('KCLUB-0001');
    expect(markup).toContain('$19.99');
    expect(markup).toContain('Download receipt');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain(INVOICE_PDF);
  });

  test('renders an unavailable state instead of a broken PDF link', () => {
    const markup = renderToStaticMarkup(
      <SubscriptionReceipts
        invoices={[{ ...INVOICE, invoicePdf: null }]}
        status="success"
        error={null}
        onRetry={onRetry}
      />,
    );

    expect(markup).toContain('PDF unavailable');
    expect(markup).not.toContain('Download receipt');
  });

  test('renders loading, empty, and recoverable error states', () => {
    const loadingMarkup = renderToStaticMarkup(
      <SubscriptionReceipts invoices={[]} status="loading" error={null} onRetry={onRetry} />,
    );
    const emptyMarkup = renderToStaticMarkup(
      <SubscriptionReceipts invoices={[]} status="success" error={null} onRetry={onRetry} />,
    );
    const errorMarkup = renderToStaticMarkup(
      <SubscriptionReceipts
        invoices={[]}
        status="error"
        error="Stripe unavailable"
        onRetry={onRetry}
      />,
    );

    expect(loadingMarkup).toContain('Loading payment history');
    expect(emptyMarkup).toContain('No paid receipts');
    expect(errorMarkup).toContain('Stripe unavailable');
    expect(errorMarkup).toContain('Try again');
  });

  test('loads only on the first visit to the subscriptions tab', () => {
    expect(shouldLoadSubscriptionReceipts('overview', 'idle')).toBe(false);
    expect(shouldLoadSubscriptionReceipts('subscriptions', 'idle')).toBe(true);
    expect(shouldLoadSubscriptionReceipts('subscriptions', 'loading')).toBe(false);
    expect(shouldLoadSubscriptionReceipts('subscriptions', 'success')).toBe(false);
    expect(shouldLoadSubscriptionReceipts('subscriptions', 'error')).toBe(false);
  });
});
