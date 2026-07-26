'use server';

import { redirect } from 'next/navigation';

import { ADMIN_API_ROUTES } from '@kclub/contracts';
import type { ApiResponse, StaffAuthSessionDto } from '@kclub/contracts';

import { clearStaffSession, readStaffSession, setStaffSession } from '@/server/auth/session';
import { createLogger } from '@/server/logger';

function getProductCoreBaseUrl(): string {
  return (
    process.env.PRODUCT_CORE_API_BASE_URL ??
    process.env.PRODUCT_CORE_ADMIN_API_URL ??
    'http://localhost:3000'
  );
}

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function postProductCore<T>(path: string, body: Record<string, string>, token?: string) {
  const response = await fetch(`${getProductCoreBaseUrl()}${path}`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  return { response, payload };
}

export async function signInStaffAction(formData: FormData): Promise<void> {
  const log = createLogger();
  const phone = formValue(formData, 'phone');
  const password = formValue(formData, 'password');

  const { response, payload } = await postProductCore<StaffAuthSessionDto>(
    ADMIN_API_ROUTES.STAFF_AUTH_PASSWORD_SIGN_IN,
    { phone, password },
  );

  if (!response.ok || !payload?.data) {
    log.auth('Staff password sign-in failed', { status: response.status, error: payload?.error });
    redirectWithError('/auth/sign-in', payload?.error?.message ?? 'Unable to sign in');
  }

  if (payload.data.state === 'TOTP_SETUP_REQUIRED' && payload.data.token) {
    await setStaffSession(payload.data.token, payload.data.expiresAt ?? undefined);
    const uri = encodeURIComponent(payload.data.totpUri ?? '');
    redirect(`/auth/mfa?setup=1&uri=${uri}`);
  }

  if (payload.data.state === 'TOTP_REQUIRED' && payload.data.token) {
    await setStaffSession(payload.data.token, payload.data.expiresAt ?? undefined);
    redirect('/auth/mfa');
  }

  if (!payload.data.token || !payload.data.expiresAt) {
    redirectWithError('/auth/sign-in', 'Unexpected auth state');
  }

  await setStaffSession(payload.data.token, payload.data.expiresAt);
  redirect('/dashboard');
}

export async function registerStaffPasswordAction(formData: FormData): Promise<void> {
  const log = createLogger();
  const phone = formValue(formData, 'phone');
  const password = formValue(formData, 'password');

  const { response, payload } = await postProductCore<{ registered: boolean }>(
    ADMIN_API_ROUTES.STAFF_AUTH_PASSWORD_REGISTER,
    { phone, password },
  );

  if (!response.ok || !payload?.data) {
    log.auth('Staff password registration failed', {
      status: response.status,
      error: payload?.error,
    });
    redirectWithError('/auth/register', payload?.error?.message ?? 'Unable to register password');
  }

  redirect(`/auth/sign-in?registered=1&phone=${encodeURIComponent(phone)}`);
}

export async function verifyTotpAction(formData: FormData): Promise<void> {
  const log = createLogger();
  const code = formValue(formData, 'code');
  const session = await readStaffSession();

  if (!session?.token) {
    redirect('/auth/sign-in');
  }

  const { response, payload } = await postProductCore<{ verified: boolean }>(
    ADMIN_API_ROUTES.STAFF_AUTH_TOTP_VERIFY,
    { code },
    session.token,
  );

  if (!response.ok || !payload?.data?.verified) {
    log.auth('TOTP verification failed', { status: response.status, error: payload?.error });
    redirectWithError('/auth/mfa', payload?.error?.message ?? 'Invalid code');
  }

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const session = await readStaffSession();

  if (session?.token) {
    await fetch(`${getProductCoreBaseUrl()}${ADMIN_API_ROUTES.STAFF_AUTH_LOGOUT}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        authorization: `Bearer ${session.token}`,
      },
    }).catch(() => {});
  }

  await clearStaffSession();
  redirect('/auth/sign-in');
}
