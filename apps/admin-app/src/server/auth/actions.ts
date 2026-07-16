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
