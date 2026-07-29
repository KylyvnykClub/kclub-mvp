import { type NextRequest } from 'next/server';
import { STAFF_PERMISSIONS } from '@kclub/contracts';
import { auditLogListSchema } from '@kclub/validation';
import { adminGuard } from '@/server/admin-guard';
import { jsonSuccess, jsonErrorFromUnknown } from '@/server/api';
import { listAuditLogs } from '@/server/services/admin-service';

export async function GET(request: NextRequest) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.AUDIT_READ);
    const { searchParams } = new URL(request.url);
    const filters = auditLogListSchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      action: searchParams.get('action') ?? undefined,
      actorRole: searchParams.get('actorRole') ?? undefined,
      actorStaffId: searchParams.get('actorStaffId') ?? undefined,
      entityType: searchParams.get('entityType') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
    });
    const result = await listAuditLogs(filters);
    return jsonSuccess(result.data, {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    });
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
