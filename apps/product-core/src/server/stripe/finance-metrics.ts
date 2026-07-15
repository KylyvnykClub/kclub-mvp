import type Stripe from 'stripe';

import { getStripeClient } from './client';

const STRIPE_INVOICE_PAGE_SIZE = 100;
// Bounds a cold-cache aggregation against Stripe rate limits and latency.
const MAX_FINANCE_INVOICES = 2000;

export async function listPaidInvoicesSince(createdGteUnix: number): Promise<Stripe.Invoice[]> {
  const stripe = getStripeClient();
  const invoices: Stripe.Invoice[] = [];

  for await (const invoice of stripe.invoices.list({
    status: 'paid',
    created: { gte: createdGteUnix },
    limit: STRIPE_INVOICE_PAGE_SIZE,
  })) {
    invoices.push(invoice);
    if (invoices.length >= MAX_FINANCE_INVOICES) break;
  }

  return invoices;
}
