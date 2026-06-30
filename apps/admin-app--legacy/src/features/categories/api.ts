import { adminApiFetch } from '@/server/proxy/admin-client';
import type { ApiResponse, CategoryDto } from '@kclub/contracts';

export async function fetchCategories(): Promise<CategoryDto[] | null> {
  const result = await adminApiFetch<ApiResponse<CategoryDto[]>>('/categories');
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}

export async function createCategory(input: {
  name: string;
  slug: string;
  isHighRisk?: boolean;
  isActive?: boolean;
}): Promise<CategoryDto | null> {
  const res = await fetch('/api/proxy/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) return null;
  return json.data;
}

export async function updateCategory(
  id: string,
  input: { name?: string; slug?: string; isHighRisk?: boolean; isActive?: boolean },
): Promise<CategoryDto | null> {
  const res = await fetch(`/api/proxy/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) return null;
  return json.data;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const res = await fetch(`/api/proxy/categories/${id}`, { method: 'DELETE' });
  return res.ok;
}
