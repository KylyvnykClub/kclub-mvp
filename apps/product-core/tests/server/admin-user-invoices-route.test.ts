import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';

import { ERROR_CODES, STAFF_PERMISSIONS } from '@kclub/contracts';

import { AppError } from '../../src/server/errors';

const USER_ID = '721cf27f-05b7-47f1-b3f0-483a961d6ed8';
const adminGuardMock = mock(async () => ({}));
const listUserInvoicesMock = mock(async () => []);

mock.module('@/server/admin-guard', () => ({
  adminGuard: adminGuardMock,
}));

mock.module('@/server/services/admin-service', () => ({
  listUserInvoices: listUserInvoicesMock,
}));

const { GET } = await import('../../src/app/api/admin/v1/users/[id]/invoices/route');

describe('GET /api/admin/v1/users/:id/invoices', () => {
  beforeEach(() => {
    adminGuardMock.mockClear();
    listUserInvoicesMock.mockClear();
  });

  test('requires USERS_READ and returns the safe invoice collection', async () => {
    const request = new NextRequest(`http://localhost/api/admin/v1/users/${USER_ID}/invoices`);
    const response = await GET(request, { params: Promise.resolve({ id: USER_ID }) });

    expect(response.status).toBe(200);
    expect(adminGuardMock).toHaveBeenCalledWith(request, STAFF_PERMISSIONS.USERS_READ);
    expect(listUserInvoicesMock).toHaveBeenCalledWith(USER_ID);
    expect(await response.json()).toMatchObject({ data: [], error: null });
  });

  test('does not call the invoice service when authorization fails', async () => {
    adminGuardMock.mockImplementationOnce(async () => {
      throw new AppError({
        code: ERROR_CODES.PERMISSION_DENIED,
        message: 'Permission denied',
        status: 403,
      });
    });
    const request = new NextRequest(`http://localhost/api/admin/v1/users/${USER_ID}/invoices`);
    const response = await GET(request, { params: Promise.resolve({ id: USER_ID }) });

    expect(response.status).toBe(403);
    expect(listUserInvoicesMock).not.toHaveBeenCalled();
  });

  test('rejects an invalid user id before authorization', async () => {
    const request = new NextRequest('http://localhost/api/admin/v1/users/not-a-user/invoices');
    const response = await GET(request, { params: Promise.resolve({ id: 'not-a-user' }) });

    expect(response.status).toBe(400);
    expect(adminGuardMock).not.toHaveBeenCalled();
    expect(listUserInvoicesMock).not.toHaveBeenCalled();
  });
});
