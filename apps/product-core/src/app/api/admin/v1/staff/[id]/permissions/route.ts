import { type NextRequest } from 'next/server';
import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { staffPermissionOverridesUpdateSchema } from '@kclub/validation';
import { adminGuard } from '@/server/admin-guard';
import { jsonSuccess, jsonErrorFromUnknown } from '@/server/api';
import { updateStaffPermissions } from '@/server/services/admin-service';

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { profile, context } = await adminGuard(request, STAFF_PERMISSIONS.STAFF_MANAGE);
    const { id } = await params;
    const body = await request.json();
    const input = staffPermissionOverridesUpdateSchema.parse(body);
    const result = await updateStaffPermissions(id, input, context);
    return jsonSuccess(result, undefined, { status: 200 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
