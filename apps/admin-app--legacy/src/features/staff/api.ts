import { adminApiFetch } from '@/server/proxy/admin-client';
import type { AdminStaffListItemDto, ApiResponse } from '@kclub/contracts';

export async function fetchStaffList(): Promise<AdminStaffListItemDto[] | null> {
  const result = await adminApiFetch<ApiResponse<AdminStaffListItemDto[]>>('/staff');
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}

export async function fetchStaffDetail(id: string): Promise<AdminStaffListItemDto | null> {
  const result = await adminApiFetch<ApiResponse<AdminStaffListItemDto>>(`/staff/${id}`);
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}
