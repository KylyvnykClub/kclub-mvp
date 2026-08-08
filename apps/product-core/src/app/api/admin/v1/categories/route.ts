import { type NextRequest } from 'next/server';
import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { categoryCreateSchema } from '@kclub/validation';
import { adminGuard } from '@/server/admin-guard';
import { jsonSuccess, jsonErrorFromUnknown } from '@/server/api';
import { listCategories, createCategory } from '@/server/services/admin-service';

export async function GET(request: NextRequest) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.TAXONOMY_MANAGE);
    const result = await listCategories();
    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.TAXONOMY_MANAGE);
    const body = await request.json();
    const input = categoryCreateSchema.parse(body);
    const result = await createCategory(input);
    return jsonSuccess(result, undefined, { status: 200 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
