'use server';

import type { AdminInvoiceDto } from '@kclub/contracts';

import { fetchUserInvoices } from './api';

export type UserInvoicesActionResult =
  { ok: true; invoices: AdminInvoiceDto[] } | { ok: false; error: string };

export async function fetchUserInvoicesAction(userId: string): Promise<UserInvoicesActionResult> {
  const invoices = await fetchUserInvoices(userId);

  if (!invoices) {
    return { ok: false, error: 'Could not load payment history from Stripe.' };
  }

  return { ok: true, invoices };
}
