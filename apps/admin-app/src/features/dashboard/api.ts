import { adminApiFetch } from '@/server/proxy/admin-client';
import type { ApiResponse, DashboardMetricsDto } from '@kclub/contracts';

export type DashboardMetricsResult =
  | { status: 'success'; data: DashboardMetricsDto }
  | { status: 'unreachable' }
  | { status: 'error'; code: string };

export async function fetchDashboardMetrics(): Promise<DashboardMetricsResult> {
  const result = await adminApiFetch<ApiResponse<DashboardMetricsDto>>('/dashboard-metrics');
  if (result.ok && result.data?.data) {
    return { status: 'success', data: result.data.data };
  }
  if (!result.ok && result.status === 0) {
    return { status: 'unreachable' };
  }
  return { status: 'error', code: result.error ?? 'UNKNOWN' };
}
