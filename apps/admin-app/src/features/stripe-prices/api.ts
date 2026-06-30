import { adminApiFetch } from '@/server/proxy/admin-client';
import type { AdminConfigEntryDto, ApiResponse } from '@kclub/contracts';

export async function fetchStripePrices(): Promise<AdminConfigEntryDto[] | null> {
  const result = await adminApiFetch<ApiResponse<AdminConfigEntryDto[]>>('/stripe-prices');
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}
