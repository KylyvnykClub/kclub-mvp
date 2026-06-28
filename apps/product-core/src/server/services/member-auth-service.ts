import { ERROR_CODES } from '@kclub/contracts';
import type { PhoneOtpSendInput, PhoneOtpVerifyInput } from '@kclub/validation';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  isDevPhoneBypassEnabled,
  verifyPhoneOtpWithDevBypass,
} from '@/server/auth/dev-phone-bypass';
import { AppError } from '@/server/errors';
import { eq } from 'drizzle-orm';
import { getDbClient, schema } from '@/server/db';

export const AUTH_INTENT = {
  SIGN_IN_EXISTS: 'SIGN_IN_EXISTS',
  SIGN_UP_NEW: 'SIGN_UP_NEW',
  SIGN_IN_BLOCKED: 'SIGN_IN_BLOCKED',
  SIGN_UP_EXISTS: 'SIGN_UP_EXISTS',
  SIGN_IN_UNKNOWN: 'SIGN_IN_UNKNOWN',
} as const;

export type AuthIntent = (typeof AUTH_INTENT)[keyof typeof AUTH_INTENT];

export function determineAuthIntent(
  existingUser: { status: string } | null,
  purpose: 'sign-in' | 'sign-up',
): AuthIntent {
  if (purpose === 'sign-in') {
    if (!existingUser) return AUTH_INTENT.SIGN_IN_UNKNOWN;
    if (existingUser.status === 'BLOCKED') return AUTH_INTENT.SIGN_IN_BLOCKED;
    return AUTH_INTENT.SIGN_IN_EXISTS;
  }

  if (purpose === 'sign-up') {
    if (existingUser) return AUTH_INTENT.SIGN_UP_EXISTS;
    return AUTH_INTENT.SIGN_UP_NEW;
  }

  return AUTH_INTENT.SIGN_IN_UNKNOWN;
}

export function assertIntentAllowed(intent: AuthIntent, purpose: 'sign-in' | 'sign-up'): void {
  if (intent === AUTH_INTENT.SIGN_IN_BLOCKED) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'Account is blocked',
      status: 403,
    });
  }

  if (intent === AUTH_INTENT.SIGN_UP_EXISTS) {
    throw new AppError({
      code: ERROR_CODES.AUTH_SIGN_UP_USE_SIGN_IN,
      message: 'An account with this phone already exists. Please sign in instead.',
      status: 409,
    });
  }

  if (intent === AUTH_INTENT.SIGN_IN_UNKNOWN) {
    throw new AppError({
      code: ERROR_CODES.AUTH_SIGN_IN_USE_SIGN_UP,
      message: 'No account found with this phone. Please sign up instead.',
      status: 404,
    });
  }
}

export async function sendPhoneOtp(
  supabase: SupabaseClient,
  input: PhoneOtpSendInput,
): Promise<{ phone: string; purpose: string; delivery: string }> {
  if (input.purpose === 'staff-sign-in') {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_INVALID_INPUT,
      message: 'Staff sign-in is not supported through this endpoint',
      status: 400,
    });
  }

  const db = getDbClient();

  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.phone, input.phone),
    columns: { id: true, status: true },
  });

  const intent = determineAuthIntent(existingUser ?? null, input.purpose);
  assertIntentAllowed(intent, input.purpose);

  if (isDevPhoneBypassEnabled()) {
    return {
      phone: input.phone,
      purpose: input.purpose,
      delivery: 'dev-bypass',
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: input.phone,
  });

  if (error) {
    throw new AppError({
      code: ERROR_CODES.AUTH_OTP_SEND_FAILED,
      message: error.message,
      status: 400,
      details: { supabaseCode: error.code ?? undefined },
    });
  }

  return {
    phone: input.phone,
    purpose: input.purpose,
    delivery: 'sms',
  };
}

export async function verifyPhoneOtp(
  supabase: SupabaseClient,
  input: PhoneOtpVerifyInput,
): Promise<{ supabaseUserId: string }> {
  if (input.purpose === 'staff-sign-in') {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_INVALID_INPUT,
      message: 'Staff sign-in is not supported through this endpoint',
      status: 400,
    });
  }

  const db = getDbClient();

  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.phone, input.phone),
    columns: { id: true, status: true },
  });

  const intent = determineAuthIntent(existingUser ?? null, input.purpose);
  assertIntentAllowed(intent, input.purpose);

  const { supabaseUserId } = isDevPhoneBypassEnabled()
    ? await verifyPhoneOtpWithDevBypass(supabase, {
        phone: input.phone,
        code: input.code,
        purpose: input.purpose,
      })
    : await verifyPhoneOtpWithSupabase(supabase, input);

  if (input.purpose === 'sign-up') {
    await db.insert(schema.users).values({
        supabase_auth_user_id: supabaseUserId,
        phone: input.phone,
    });
  }

  return { supabaseUserId };
}

async function verifyPhoneOtpWithSupabase(
  supabase: SupabaseClient,
  input: PhoneOtpVerifyInput,
): Promise<{ supabaseUserId: string }> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: input.phone,
    token: input.code,
    type: 'sms',
  });

  if (error || !data.user) {
    throw new AppError({
      code: ERROR_CODES.AUTH_OTP_INVALID,
      message: error?.message ?? 'Invalid or expired OTP code',
      status: 401,
      details: error ? { supabaseCode: error.code ?? undefined } : undefined,
    });
  }

  return { supabaseUserId: data.user.id };
}

export async function signOutLocal(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' });

  if (error) {
    throw new AppError({
      code: ERROR_CODES.AUTH_SESSION_REQUIRED,
      message: error.message,
      status: 500,
    });
  }
}
