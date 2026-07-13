import type Stripe from 'stripe';

import type { AdminInvoiceDto } from '@kclub/contracts';

import { getStripeClient } from './client';

const MAX_ADMIN_RECEIPTS = 24;
const STRIPE_INVOICE_PAGE_SIZE = 100;

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;

  if (!subscription) return null;
  return typeof subscription === 'string' ? subscription : subscription.id;
}

function toAdminInvoiceDto(
  invoice: Stripe.Invoice,
  stripeSubscriptionIds: ReadonlySet<string>,
): AdminInvoiceDto | null {
  const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);

  if (
    invoice.status !== 'paid' ||
    !stripeSubscriptionId ||
    !stripeSubscriptionIds.has(stripeSubscriptionId)
  ) {
    return null;
  }

  return {
    id: invoice.id,
    number: invoice.number,
    stripeSubscriptionId,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status,
    periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
    periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
    invoicePdf: invoice.invoice_pdf ?? null,
    createdAt: new Date(invoice.created * 1000).toISOString(),
  };
}

function isAdminInvoiceDto(invoice: AdminInvoiceDto | null): invoice is AdminInvoiceDto {
  return invoice !== null;
}

export async function listPaidVipInvoices(
  stripeCustomerId: string,
  stripeSubscriptionIds: readonly string[],
): Promise<AdminInvoiceDto[]> {
  if (stripeSubscriptionIds.length === 0) return [];

  const stripe = getStripeClient();
  const invoices = await stripe.invoices.list({
    customer: stripeCustomerId,
    status: 'paid',
    limit: STRIPE_INVOICE_PAGE_SIZE,
  });
  const allowedSubscriptionIds = new Set(stripeSubscriptionIds);

  return invoices.data
    .map((invoice) => toAdminInvoiceDto(invoice, allowedSubscriptionIds))
    .filter(isAdminInvoiceDto)
    .slice(0, MAX_ADMIN_RECEIPTS);
}

export { getInvoiceSubscriptionId, toAdminInvoiceDto };
