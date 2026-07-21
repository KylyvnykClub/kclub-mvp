import { type NextRequest } from 'next/server';
import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { adminIntroductionListSchema } from '@kclub/validation';
import { adminGuard } from '@/server/admin-guard';
import { jsonSuccess, jsonErrorFromUnknown } from '@/server/api';
import { listIntroductions } from '@/server/services/admin-service';

export async function GET(request: NextRequest) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.INTRODUCTIONS_MODERATE);
    const { searchParams } = new URL(request.url);
    const filters = adminIntroductionListSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status') ?? undefined,
      businessId: searchParams.get('businessId') ?? undefined,
    });
    const result = await listIntroductions(filters);
    return jsonSuccess(result.data, {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
