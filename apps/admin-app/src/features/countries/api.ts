import { adminApiFetch } from '@/server/proxy/admin-client';
import type { ApiResponse, CountryDto } from '@kclub/contracts';

export async function fetchCountries(): Promise<CountryDto[] | null> {
  const result = await adminApiFetch<ApiResponse<CountryDto[]>>('/countries');
  if (!result.ok || !result.data?.data) return null;
  return result.data.data;
}

export async function createCountry(input: {
  code2: string;
  code3?: string;
  name: string;
  slug: string;
  isActive?: boolean;
}): Promise<CountryDto | null> {
  const res = await fetch('/api/proxy/countries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) return null;
  return json.data;
}

export async function updateCountry(
  id: string,
  input: { code2?: string; code3?: string; name?: string; slug?: string; isActive?: boolean },
): Promise<CountryDto | null> {
  const res = await fetch(`/api/proxy/countries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) return null;
  return json.data;
}

export async function deleteCountry(id: string): Promise<boolean> {
  const res = await fetch(`/api/proxy/countries/${id}`, { method: 'DELETE' });
  return res.ok;
}
