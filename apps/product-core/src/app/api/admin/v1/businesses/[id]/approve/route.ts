import { type NextRequest } from 'next/server';
import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { businessApproveSchema } from '@kclub/validation';
import { adminGuard } from '@/server/admin-guard';
import { jsonSuccess, jsonErrorFromUnknown } from '@/server/api';
import { approveBusiness } from '@/server/services/admin-service';

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { context } = await adminGuard(request, STAFF_PERMISSIONS.BUSINESSES_MODERATE);
    const { id } = await params;
    const body = await request.json();
    const input = businessApproveSchema.parse(body);
    const result = await approveBusiness(id, input, context);
    return jsonSuccess(result, undefined, { status: 200 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
