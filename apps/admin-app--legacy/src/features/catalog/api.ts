import { adminApiFetch } from '@/server/proxy/admin-client';
import type { AdminBusinessListItemDto, ApiListResponse } from '@kclub/contracts';

export type CatalogListResult = {
  businesses: AdminBusinessListItemDto[];
  total: number;
};

export async function fetchCatalogBusinesses(
  page: number = 1,
  limit: number = 100,
): Promise<CatalogListResult | null> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(page));
  searchParams.set('limit', String(limit));

  const result = await adminApiFetch<ApiListResponse<AdminBusinessListItemDto>>(
    `/businesses?${searchParams.toString()}`,
  );
  if (!result.ok || !result.data?.data) return null;

  return {
    businesses: result.data.data,
    total: result.data.meta?.total ?? 0,
  };
}
