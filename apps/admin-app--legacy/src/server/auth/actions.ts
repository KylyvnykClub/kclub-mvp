'use server';

import { redirect } from 'next/navigation';

import { ADMIN_API_ROUTES } from '@kclub/contracts';
import { clearStaffSession, readStaffSession, setStaffSession } from '@/server/auth/session';
import { createLogger } from '@/server/logger';
import type {
  ApiResponse,
  StaffAuthChallengeDto,
  StaffAuthSessionDto,
  StaffTotpSetupDto,
} from '@kclub/contracts';

function getProductCoreBaseUrl() {
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

export async function sendStaffOtpAction(formData: FormData) {
  const log = createLogger();
  const phone = formValue(formData, 'phone');

  const { response, payload } = await postProductCore<StaffAuthChallengeDto>(
    ADMIN_API_ROUTES.STAFF_AUTH_PHONE_OTP_SEND,
    { phone },
  );

  if (!response.ok || !payload?.data) {
    log.auth('Staff OTP send failed', { status: response.status, error: payload?.error });
    redirectWithError('/auth/sign-in', payload?.error?.message ?? 'Unable to send staff OTP');
  }

  redirect(`/auth/sign-in?sent=1&phone=${encodeURIComponent(payload.data.phone)}`);
}

export async function verifyStaffOtpAction(formData: FormData) {
  const log = createLogger();
  const phone = formValue(formData, 'phone');
  const code = formValue(formData, 'code');

  const { response, payload } = await postProductCore<StaffAuthSessionDto>(
    ADMIN_API_ROUTES.STAFF_AUTH_PHONE_OTP_VERIFY,
    { phone, code },
  );

  if (!response.ok || !payload?.data) {
    log.auth('Staff OTP verify failed', { status: response.status, error: payload?.error });
    redirectWithError('/auth/sign-in', payload?.error?.message ?? 'Unable to verify staff OTP');
  }

  await setStaffSession(payload.data.token, payload.data.expiresAt);

  if (payload.data.state === 'AUTHENTICATED') {
    redirect('/dashboard');
  } else if (payload.data.state === 'TOTP_SETUP_REQUIRED') {
    redirect('/auth/totp-setup');
  } else {
    redirect('/auth/2fa-required');
  }
}

export async function verifyStaffTotpAction(formData: FormData) {
  const log = createLogger();
  const session = await readStaffSession();
  if (!session?.token) {
    log.auth('Staff TOTP verify failed: no session');
    redirect('/auth/sign-in');
  }

  const code = formValue(formData, 'code');
  const { response, payload } = await postProductCore<StaffAuthSessionDto>(
    ADMIN_API_ROUTES.STAFF_AUTH_TOTP_VERIFY,
    { code },
    session.token,
  );

  if (!response.ok || !payload?.data) {
    log.auth('Staff TOTP verify failed', { status: response.status, error: payload?.error });
    redirectWithError(
      '/auth/2fa-required',
      payload?.error?.message ?? 'Unable to verify authenticator code',
    );
  }

  await setStaffSession(payload.data.token, payload.data.expiresAt);
  redirect('/dashboard');
}

export async function setupStaffTotpAction(): Promise<{
  provisioningUri: string;
  manualKey: string;
} | null> {
  const session = await readStaffSession();
  if (!session?.token) {
    redirect('/auth/sign-in');
  }

  const response = await fetch(
    `${getProductCoreBaseUrl()}${ADMIN_API_ROUTES.STAFF_AUTH_TOTP_SETUP}`,
    {
      method: 'GET',
      cache: 'no-store',
      headers: {
        authorization: `Bearer ${session.token}`,
      },
    },
  );

  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<StaffTotpSetupDto> | null;

  if (!response.ok || !payload?.data) {
    return null;
  }

  return {
    provisioningUri: payload.data.provisioningUri,
    manualKey: payload.data.manualKey,
  };
}

export async function logoutAction() {
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
