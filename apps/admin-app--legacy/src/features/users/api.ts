import { adminApiFetch } from '@/server/proxy/admin-client';
import type {
  AdminUserListItemDto,
  AdminUserDetailDto,
  ApiListResponse,
  ApiResponse,
  StaffRole,
} from '@kclub/contracts';

export type UsersSearchParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  membershipTier?: string;
};

export type UsersListResult = {
  users: AdminUserListItemDto[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchUsers(params: UsersSearchParams = {}): Promise<UsersListResult | null> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.membershipTier) searchParams.set('membershipTier', params.membershipTier);

  const qs = searchParams.toString();
  const result = await adminApiFetch<ApiListResponse<AdminUserListItemDto>>(
    `/users${qs ? `?${qs}` : ''}`,
  );
  if (!result.ok || !result.data?.data) return null;

  return {
    users: result.data.data,
    total: result.data.meta?.total ?? 0,
    page: result.data.meta?.page ?? params.page ?? 1,
    limit: result.data.meta?.limit ?? params.limit ?? 20,
  };
}

export async function fetchUserDetail(userId: string): Promise<AdminUserDetailDto | null> {
  const result = await adminApiFetch<ApiResponse<AdminUserDetailDto>>(`/users/${userId}`);
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}

export function canMutateUsers(role: StaffRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}
