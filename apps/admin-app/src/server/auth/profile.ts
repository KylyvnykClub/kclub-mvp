import { readStaffSession } from '@/server/auth/session';
import { createLogger } from '@/server/logger';
import type {
  ApiResponse,
  StaffPermissionOverrides,
  StaffProfileDto,
  StaffRole,
} from '@kclub/contracts';

export type StaffProfile = {
  id: string;
  phone: string;
  name: string;
  role: StaffRole;
  permissionOverrides: StaffPermissionOverrides | null;
  initials: string;
};

function getProductCoreBaseUrl() {
  return (
    process.env.PRODUCT_CORE_API_BASE_URL ??
    process.env.PRODUCT_CORE_ADMIN_API_URL ??
    'http://localhost:3000'
  );
}

async function fetchVerifiedStaffProfile(token: string): Promise<StaffProfileDto | null> {
  const log = createLogger();
  const url = `${getProductCoreBaseUrl()}/api/admin/v1/staff-auth/session`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    log.auth('fetchVerifiedStaffProfile network error', {
      url,
      error: String(err),
    });
    return null;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    log.auth('fetchVerifiedStaffProfile non-ok response', {
      url,
      status: response.status,
      body: body.slice(0, 500),
    });
    return null;
  }

  try {
    const payload = (await response.json()) as ApiResponse<StaffProfileDto>;
    if (!payload.data) {
      log.auth('fetchVerifiedStaffProfile empty payload.data', {
        url,
        payload: JSON.stringify(payload).slice(0, 500),
      });
    }
    return payload.data;
  } catch (err) {
    log.auth('fetchVerifiedStaffProfile JSON parse error', {
      url,
      error: String(err),
    });
    return null;
  }
}

export async function readStaffProfile(): Promise<StaffProfile | null> {
  const session = await readStaffSession();
  if (!session?.token) return null;

  const profile = await fetchVerifiedStaffProfile(session.token);
  if (!profile) return null;

  const name = profile.displayName ?? profile.phone;
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  return {
    id: profile.id,
    phone: profile.phone,
    name,
    role: profile.role as StaffRole,
    permissionOverrides: profile.permissionOverrides ?? null,
    initials,
  };
}

export async function requireStaffProfile(): Promise<StaffProfile> {
  const profile = await readStaffProfile();
  if (!profile) {
    const { redirect } = await import('next/navigation');
    redirect('/auth/sign-in');
    throw new Error('unreachable');
  }
  return profile;
}
