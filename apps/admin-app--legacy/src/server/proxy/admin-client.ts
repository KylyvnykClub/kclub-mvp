import { readStaffSession } from '@/server/auth/session';
import type { AdminProxyRequestOptions, AdminProxyResult } from '@/server/proxy/types';

const ADMIN_API_PREFIX = '/api/admin/v1';

function getProductCoreBaseUrl() {
  return (
    process.env.PRODUCT_CORE_API_BASE_URL ??
    process.env.PRODUCT_CORE_ADMIN_API_URL ??
    'http://localhost:3000'
  );
}

export async function adminApiFetch<T>(
  path: string,
  options: AdminProxyRequestOptions = {},
): Promise<AdminProxyResult<T>> {
  const session = await readStaffSession();

  if (!session?.token) {
    return {
      ok: false,
      status: 401,
      data: null,
      error: 'UNAUTHENTICATED_STAFF_SESSION',
    };
  }

  const response = await fetch(`${getProductCoreBaseUrl()}${ADMIN_API_PREFIX}${path}`, {
    method: options.method ?? 'GET',
    cache: options.cache ?? 'no-store',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.token}`,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: null,
      error: `ADMIN_API_${response.status}`,
    };
  }

  const payload = (await response.json()) as T;

  return {
    ok: true,
    status: response.status,
    data: payload,
    error: null,
  };
}
