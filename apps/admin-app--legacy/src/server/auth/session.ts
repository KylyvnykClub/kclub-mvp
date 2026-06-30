import { cookies } from 'next/headers';

const STAFF_SESSION_COOKIE = 'kclub_staff_session';
const STAFF_SESSION_TTL_SECONDS = 60 * 60 * 8;

export type StaffSession = {
  token: string;
  expiresAtIso: string;
};

export async function readStaffSession(): Promise<StaffSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return {
    token,
    expiresAtIso: new Date(Date.now() + STAFF_SESSION_TTL_SECONDS * 1000).toISOString(),
  };
}

export async function setStaffSession(token: string, expiresAtIso?: string) {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: STAFF_SESSION_TTL_SECONDS,
    ...(expiresAtIso ? { expires: new Date(expiresAtIso) } : {}),
  });
}

export async function clearStaffSession() {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export { STAFF_SESSION_COOKIE, STAFF_SESSION_TTL_SECONDS };
