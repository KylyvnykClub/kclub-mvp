import { type NextRequest } from 'next/server';
import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { adminGuard } from '@/server/admin-guard';
import { jsonSuccess, jsonErrorFromUnknown } from '@/server/api';
import { getStaffDetail } from '@/server/services/admin-service';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.STAFF_MANAGE);
    const { id } = await params;
    const result = await getStaffDetail(id);
    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
