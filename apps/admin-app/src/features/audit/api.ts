import { adminApiFetch } from '@/server/proxy/admin-client';
import type { ApiListResponse, AuditLogDto } from '@kclub/contracts';

export type AuditLogSearchParams = {
  page?: number;
  limit?: number;
  action?: string;
  actorRole?: string;
  actorStaffId?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AuditLogListResult = {
  logs: AuditLogDto[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchAuditLogs(
  params: AuditLogSearchParams = {},
): Promise<AuditLogListResult | null> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.action) searchParams.set('action', params.action);
  if (params.actorRole) searchParams.set('actorRole', params.actorRole);
  if (params.actorStaffId) searchParams.set('actorStaffId', params.actorStaffId);
  if (params.entityType) searchParams.set('entityType', params.entityType);
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);

  const qs = searchParams.toString();
  const result = await adminApiFetch<ApiListResponse<AuditLogDto>>(`/audit${qs ? `?${qs}` : ''}`);
  if (!result.ok || !result.data?.data) return null;

  return {
    logs: result.data.data,
    total: result.data.meta?.total ?? 0,
    page: result.data.meta?.page ?? params.page ?? 1,
    limit: result.data.meta?.limit ?? params.limit ?? 20,
  };
}
