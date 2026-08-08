import { type NextRequest } from 'next/server';
import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { categoryUpdateSchema } from '@kclub/validation';
import { adminGuard } from '@/server/admin-guard';
import { jsonSuccess, jsonErrorFromUnknown } from '@/server/api';
import { getCategory, updateCategory, deleteCategory } from '@/server/services/admin-service';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.TAXONOMY_MANAGE);
    const { id } = await params;
    const result = await getCategory(id);
    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.TAXONOMY_MANAGE);
    const { id } = await params;
    const body = await request.json();
    const input = categoryUpdateSchema.parse(body);
    const result = await updateCategory(id, input);
    return jsonSuccess(result, undefined, { status: 200 });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.TAXONOMY_MANAGE);
    const { id } = await params;
    await deleteCategory(id);
    return jsonSuccess({ success: true });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
