import { adminApiFetch } from '@/server/proxy/admin-client';
import type { AdminCardListItemDto, ApiListResponse } from '@kclub/contracts';

export type CardsSearchParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  membershipTier?: string;
};

export type CardsListResult = {
  cards: AdminCardListItemDto[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchCards(params: CardsSearchParams = {}): Promise<CardsListResult | null> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.membershipTier) searchParams.set('membershipTier', params.membershipTier);

  const qs = searchParams.toString();
  const result = await adminApiFetch<ApiListResponse<AdminCardListItemDto>>(
    `/cards${qs ? `?${qs}` : ''}`,
  );
  if (!result.ok || !result.data?.data) return null;

  return {
    cards: result.data.data,
    total: result.data.meta?.total ?? 0,
    page: result.data.meta?.page ?? params.page ?? 1,
    limit: result.data.meta?.limit ?? params.limit ?? 20,
  };
}
