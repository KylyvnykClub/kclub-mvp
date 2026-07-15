import { adminApiFetch } from '@/server/proxy/admin-client';
import type { ApiResponse, DashboardMetricsDto, FinanceDashboardDto } from '@kclub/contracts';

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

export type FinanceDashboardResult =
  | { status: 'success'; data: FinanceDashboardDto }
  | { status: 'forbidden' }
  | { status: 'unavailable' }
  | { status: 'unreachable' }
  | { status: 'error'; code: string };

export async function fetchFinanceDashboard(): Promise<FinanceDashboardResult> {
  // A cold product-core cache aggregates Stripe invoices live, so allow more
  // headroom than the default 15s proxy timeout.
  const result = await adminApiFetch<ApiResponse<FinanceDashboardDto>>('/finance-metrics', {
    timeoutMs: 30_000,
  });
  if (result.ok && result.data?.data) {
    return { status: 'success', data: result.data.data };
  }
  if (result.status === 403) {
    return { status: 'forbidden' };
  }
  if (result.status === 404) {
    // Older product-core deployment without the finance endpoint.
    return { status: 'unavailable' };
  }
  if (!result.ok && result.status === 0) {
    return { status: 'unreachable' };
  }
  return { status: 'error', code: result.error ?? 'UNKNOWN' };
}
