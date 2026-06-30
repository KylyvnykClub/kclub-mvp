import { readStaffSession } from '@/server/auth/session';
import type { ApiResponse, StaffProfileDto, StaffRole } from '@kclub/contracts';

export type StaffProfile = {
  id: string;
  phone: string;
  name: string;
  role: StaffRole;
  initials: string;
  totpVerified: boolean;
};

function getProductCoreBaseUrl() {
  return (
    process.env.PRODUCT_CORE_API_BASE_URL ??
    process.env.PRODUCT_CORE_ADMIN_API_URL ??
    'http://localhost:3000'
  );
}

async function fetchVerifiedStaffProfile(token: string): Promise<StaffProfileDto | null> {
  const response = await fetch(`${getProductCoreBaseUrl()}/api/admin/v1/staff-auth/session`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as ApiResponse<StaffProfileDto>;
  return payload.data;
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
    initials,
    totpVerified: profile.totpVerified,
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
