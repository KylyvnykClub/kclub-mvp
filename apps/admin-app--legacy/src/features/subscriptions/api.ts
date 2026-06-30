import { adminApiFetch } from '@/server/proxy/admin-client';
import type { AdminSubscriptionListItemDto, ApiResponse, StaffRole } from '@kclub/contracts';

export async function fetchSubscriptions(): Promise<AdminSubscriptionListItemDto[] | null> {
  const result = await adminApiFetch<ApiResponse<AdminSubscriptionListItemDto[]>>('/subscriptions');
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}

export async function fetchSubscriptionDetail(
  id: string,
): Promise<AdminSubscriptionListItemDto | null> {
  const result = await adminApiFetch<ApiResponse<AdminSubscriptionListItemDto>>(
    `/subscriptions/${id}`,
  );
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}

export function canCancelSubscription(role: StaffRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}
