import { adminApiFetch } from '@/server/proxy/admin-client';
import type { ApiResponse, DashboardMetricsDto } from '@kclub/contracts';

export async function fetchDashboardMetrics(): Promise<DashboardMetricsDto | null> {
  const result = await adminApiFetch<ApiResponse<DashboardMetricsDto>>('/dashboard-metrics');
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}
