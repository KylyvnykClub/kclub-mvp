import { type NextRequest } from 'next/server';
import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { staffPasswordResetSchema } from '@kclub/validation';

import { adminGuard } from '@/server/admin-guard';
import { jsonSuccess, jsonErrorFromUnknown } from '@/server/api';
import { resetStaffPassword } from '@/server/services/admin-service';

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { context } = await adminGuard(request, STAFF_PERMISSIONS.STAFF_MANAGE);
    const { id } = await params;
    const body = await request.json();
    const input = staffPasswordResetSchema.parse(body);
    const result = await resetStaffPassword(id, input, context);
    return jsonSuccess(result, undefined, { status: 200 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
