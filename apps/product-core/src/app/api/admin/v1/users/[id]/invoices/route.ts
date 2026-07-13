import type { NextRequest } from 'next/server';

import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { entityIdParamSchema } from '@kclub/validation';

import { adminGuard } from '@/server/admin-guard';
import { jsonErrorFromUnknown, jsonSuccess } from '@/server/api';
import { listUserInvoices } from '@/server/services/admin-service';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = entityIdParamSchema.parse(await params);
    await adminGuard(request, STAFF_PERMISSIONS.USERS_READ);
    const invoices = await listUserInvoices(id);
    return jsonSuccess(invoices);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
