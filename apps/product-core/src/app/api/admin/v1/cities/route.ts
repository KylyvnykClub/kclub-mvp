import { type NextRequest } from 'next/server';
import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { cityCreateSchema } from '@kclub/validation';
import { adminGuard } from '@/server/admin-guard';
import { jsonSuccess, jsonErrorFromUnknown } from '@/server/api';
import { listCities, createCity } from '@/server/services/admin-service';

export async function GET(request: NextRequest) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.TAXONOMY_MANAGE);
    const result = await listCities();
    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.TAXONOMY_MANAGE);
    const body = await request.json();
    const input = cityCreateSchema.parse(body);
    const result = await createCity(input);
    return jsonSuccess(result, undefined, { status: 200 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
