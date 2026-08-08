import { type NextRequest } from 'next/server';
import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { adminConfigUpdateSchema } from '@kclub/validation';
import { adminGuard } from '@/server/admin-guard';
import { jsonSuccess, jsonErrorFromUnknown } from '@/server/api';
import { getAdminConfig, updateAdminConfig } from '@/server/services/admin-service';

type Params = {
  params: Promise<{ key: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.STRIPE_PRICES_MANAGE);
    const { key } = await params;
    const result = await getAdminConfig(key);
    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.STRIPE_PRICES_MANAGE);
    const { key } = await params;
    const body = await request.json();
    const input = adminConfigUpdateSchema.parse(body);
    const result = await updateAdminConfig(key, input);
    return jsonSuccess(result, undefined, { status: 200 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
