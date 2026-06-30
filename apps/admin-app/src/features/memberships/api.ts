import { adminApiFetch } from '@/server/proxy/admin-client';
import type { ApiResponse, MembershipPlanDto } from '@kclub/contracts';

export async function fetchMembershipPlans(): Promise<MembershipPlanDto[] | null> {
  const result = await adminApiFetch<ApiResponse<MembershipPlanDto[]>>('/memberships');
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}
