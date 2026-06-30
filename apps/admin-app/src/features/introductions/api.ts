import { adminApiFetch } from '@/server/proxy/admin-client';
import type { AdminIntroductionListItemDto, ApiResponse, StaffRole } from '@kclub/contracts';

export async function fetchIntroductions(): Promise<AdminIntroductionListItemDto[] | null> {
  const result = await adminApiFetch<ApiResponse<AdminIntroductionListItemDto[]>>('/introductions');
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}

export async function fetchIntroductionDetail(
  id: string,
): Promise<AdminIntroductionListItemDto | null> {
  const result = await adminApiFetch<ApiResponse<AdminIntroductionListItemDto>>(
    `/introductions/${id}`,
  );
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}

export function canMutateIntroductions(role: StaffRole): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'MODERATOR';
}
