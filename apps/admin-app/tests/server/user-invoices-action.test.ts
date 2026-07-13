import { beforeEach, describe, expect, mock, test } from 'bun:test';

import type { AdminInvoiceDto } from '@kclub/contracts';

const fetchUserInvoicesMock = mock(async (): Promise<AdminInvoiceDto[] | null> => []);

mock.module('@/features/users/api', () => ({
  fetchUserInvoices: fetchUserInvoicesMock,
}));

const { fetchUserInvoicesAction } = await import('../../src/features/users/actions');

describe('fetchUserInvoicesAction', () => {
  beforeEach(() => {
    fetchUserInvoicesMock.mockClear();
  });

  test('returns invoices from the authenticated admin API client', async () => {
    const result = await fetchUserInvoicesAction('721cf27f-05b7-47f1-b3f0-483a961d6ed8');

    expect(result).toEqual({ ok: true, invoices: [] });
  });

  test('returns a recoverable error when product-core is unavailable', async () => {
    fetchUserInvoicesMock.mockImplementationOnce(async () => null);

    const result = await fetchUserInvoicesAction('721cf27f-05b7-47f1-b3f0-483a961d6ed8');

    expect(result).toEqual({
      ok: false,
      error: 'Could not load payment history from Stripe.',
    });
  });
});
