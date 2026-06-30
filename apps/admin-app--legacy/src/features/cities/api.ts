import { adminApiFetch } from '@/server/proxy/admin-client';
import type { ApiResponse, CityDto } from '@kclub/contracts';

export async function fetchCities(): Promise<CityDto[] | null> {
  const result = await adminApiFetch<ApiResponse<CityDto[]>>('/cities');
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}

export async function createCity(input: {
  countryId: string;
  name: string;
  slug: string;
  isActive?: boolean;
}): Promise<CityDto | null> {
  const res = await fetch('/api/proxy/cities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) return null;
  return json.data;
}

export async function updateCity(
  id: string,
  input: { countryId?: string; name?: string; slug?: string; isActive?: boolean },
): Promise<CityDto | null> {
  const res = await fetch(`/api/proxy/cities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) return null;
  return json.data;
}

export async function deleteCity(id: string): Promise<boolean> {
  const res = await fetch(`/api/proxy/cities/${id}`, { method: 'DELETE' });
  return res.ok;
}
