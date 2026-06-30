import { adminApiFetch } from '@/server/proxy/admin-client';
import type {
  AdminBusinessListItemDto,
  AdminBusinessDetailDto,
  ApiListResponse,
  ApiResponse,
} from '@kclub/contracts';

export type BusinessesSearchParams = {
  page?: number;
  limit?: number;
  status?: string;
};

export type BusinessesListResult = {
  businesses: AdminBusinessListItemDto[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchBusinesses(
  params: BusinessesSearchParams = {},
): Promise<BusinessesListResult | null> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);

  const qs = searchParams.toString();
  const result = await adminApiFetch<ApiListResponse<AdminBusinessListItemDto>>(
    `/businesses${qs ? `?${qs}` : ''}`,
  );
  if (!result.ok || !result.data?.data) return null;

  return {
    businesses: result.data.data,
    total: result.data.meta?.total ?? 0,
    page: result.data.meta?.page ?? params.page ?? 1,
    limit: result.data.meta?.limit ?? params.limit ?? 20,
  };
}

export async function fetchBusinessDetail(
  businessId: string,
): Promise<AdminBusinessDetailDto | null> {
  const result = await adminApiFetch<ApiResponse<AdminBusinessDetailDto>>(
    `/businesses/${businessId}`,
  );
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}
