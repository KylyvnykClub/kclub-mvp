import { adminApiFetch } from '@/server/proxy/admin-client';
import type { AdminPaymentDto, ApiResponse } from '@kclub/contracts';

export async function fetchPayments(): Promise<AdminPaymentDto[] | null> {
  const result = await adminApiFetch<ApiResponse<AdminPaymentDto[]>>('/payments');
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}
