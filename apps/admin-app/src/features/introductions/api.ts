import { adminApiFetch } from '@/server/proxy/admin-client';
import type {
  AdminIntroductionListItemDto,
  ApiListResponse,
  ApiResponse,
  StaffRole,
} from '@kclub/contracts';

export type IntroductionListParams = {
  page?: number;
  limit?: number;
  status?: string;
  businessId?: string;
};

export type IntroductionListResult = {
  introductions: AdminIntroductionListItemDto[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchIntroductions(
  params: IntroductionListParams = {},
): Promise<IntroductionListResult | null> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);
  if (params.businessId) searchParams.set('businessId', params.businessId);

  const qs = searchParams.toString();
  const result = await adminApiFetch<ApiListResponse<AdminIntroductionListItemDto>>(
    `/introductions${qs ? `?${qs}` : ''}`,
  );
  if (!result.ok || !result.data?.data) return null;

  return {
    introductions: result.data.data,
    total: result.data.meta?.total ?? result.data.data.length,
    page: result.data.meta?.page ?? params.page ?? 1,
    limit: result.data.meta?.limit ?? params.limit ?? 20,
  };
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
