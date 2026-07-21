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
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      action: searchParams.get('action'),
      actorRole: searchParams.get('actorRole'),
      actorStaffId: searchParams.get('actorStaffId') ?? undefined,
      entityType: searchParams.get('entityType'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
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
