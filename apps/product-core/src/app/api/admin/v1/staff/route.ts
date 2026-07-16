import { type NextRequest } from 'next/server';
import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { adminStaffCreateSchema } from '@kclub/validation';
import { adminGuard } from '@/server/admin-guard';
import { jsonSuccess, jsonErrorFromUnknown } from '@/server/api';
import { createStaff, listStaff } from '@/server/services/admin-service';

export async function GET(request: NextRequest) {
  try {
    const { profile, context } = await adminGuard(request, STAFF_PERMISSIONS.STAFF_MANAGE);
    const result = await listStaff(context);
    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { context } = await adminGuard(request, STAFF_PERMISSIONS.STAFF_MANAGE);
    const body = await request.json();
    const input = adminStaffCreateSchema.parse(body);
    const result = await createStaff(input, context);
    return jsonSuccess(result, undefined, { status: 201 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
