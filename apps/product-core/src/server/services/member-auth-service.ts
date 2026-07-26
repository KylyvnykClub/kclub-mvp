import { ERROR_CODES, type ErrorCode } from '@kclub/contracts';
import type {
  MemberPasswordRecoverySendInput,
  MemberPasswordRecoveryVerifyInput,
  MemberPasswordSignInInput,
  MemberSignUpInput,
  MemberSignUpVerifyInput,
} from '@kclub/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';

import {
  createDevPhoneBypassUser,
  isDevPhoneBypassEnabled,
  verifyPhoneOtpWithDevBypass,
} from '@/server/auth/dev-phone-bypass';
import { getDbClient, schema } from '@/server/db';
import { AppError } from '@/server/errors';

export const AUTH_INTENT = {
  SIGN_IN_EXISTS: 'SIGN_IN_EXISTS',
  SIGN_UP_NEW: 'SIGN_UP_NEW',
  SIGN_IN_BLOCKED: 'SIGN_IN_BLOCKED',
  SIGN_UP_EXISTS: 'SIGN_UP_EXISTS',
  SIGN_IN_UNKNOWN: 'SIGN_IN_UNKNOWN',
} as const;

export type AuthIntent = (typeof AUTH_INTENT)[keyof typeof AUTH_INTENT];

type ExistingMember = {
  id: string;
  status: string;
  supabase_auth_user_id: string | null;
};

export function determineAuthIntent(
  existingUser: { status: string } | null,
  purpose: 'sign-in' | 'sign-up',
): AuthIntent {
  if (purpose === 'sign-in') {
    if (!existingUser) return AUTH_INTENT.SIGN_IN_UNKNOWN;
    if (existingUser.status === 'BLOCKED') return AUTH_INTENT.SIGN_IN_BLOCKED;
    return AUTH_INTENT.SIGN_IN_EXISTS;
  }

  if (existingUser) return AUTH_INTENT.SIGN_UP_EXISTS;
  return AUTH_INTENT.SIGN_UP_NEW;
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

async function findMemberByPhone(phone: string): Promise<ExistingMember | null> {
  const db = getDbClient();
  const user = await db.query.users.findFirst({
    where: eq(schema.users.phone, phone),
    columns: { id: true, status: true, supabase_auth_user_id: true },
  });

  return user ?? null;
}

function throwSupabaseAuthError(
  error: { code?: string | undefined; message: string },
  code: ErrorCode,
  status = 400,
): never {
  throw new AppError({
    code,
    message: error.message,
    status,
    details: { supabaseCode: error.code },
  });
}

export async function startMemberSignUp(
  supabase: SupabaseClient,
  input: MemberSignUpInput,
): Promise<{ phone: string; delivery: string }> {
  const existingUser = await findMemberByPhone(input.phone);
  assertIntentAllowed(determineAuthIntent(existingUser, 'sign-up'), 'sign-up');

  if (isDevPhoneBypassEnabled()) {
    await createDevPhoneBypassUser(input.phone, input.password);
    return { phone: input.phone, delivery: 'dev-bypass' };
  }

  const { error } = await supabase.auth.signUp({ phone: input.phone, password: input.password });
  if (error) throwSupabaseAuthError(error, ERROR_CODES.AUTH_OTP_SEND_FAILED);

  return { phone: input.phone, delivery: 'sms' };
}

export async function verifyMemberSignUp(
  supabase: SupabaseClient,
  input: MemberSignUpVerifyInput,
): Promise<{ supabaseUserId: string }> {
  const existingUser = await findMemberByPhone(input.phone);
  assertIntentAllowed(determineAuthIntent(existingUser, 'sign-up'), 'sign-up');

  const { supabaseUserId } = isDevPhoneBypassEnabled()
    ? await verifyPhoneOtpWithDevBypass(supabase, { ...input, purpose: 'sign-up' })
    : await verifyPhoneOtpWithSupabase(supabase, input.phone, input.code);

  const db = getDbClient();
  await db.insert(schema.users).values({
    supabase_auth_user_id: supabaseUserId,
    phone: input.phone,
  });

  return { supabaseUserId };
}

export async function signInMemberWithPassword(
  supabase: SupabaseClient,
  input: MemberPasswordSignInInput,
): Promise<{ supabaseUserId: string }> {
  const existingUser = await findMemberByPhone(input.phone);
  assertIntentAllowed(determineAuthIntent(existingUser, 'sign-in'), 'sign-in');

  const { data, error } = await supabase.auth.signInWithPassword({
    phone: input.phone,
    password: input.password,
  });
  if (error || !data.user) {
    throwSupabaseAuthError(
      error ?? { message: 'Invalid phone or password' },
      ERROR_CODES.AUTH_PASSWORD_INVALID,
      401,
    );
  }

  if (!existingUser?.supabase_auth_user_id || data.user.id !== existingUser.supabase_auth_user_id) {
    throw new AppError({
      code: ERROR_CODES.AUTH_SESSION_INVALID,
      message: 'Authenticated user does not match member account',
      status: 401,
    });
  }

  return { supabaseUserId: data.user.id };
}

export async function startMemberPasswordRecovery(
  supabase: SupabaseClient,
  input: MemberPasswordRecoverySendInput,
): Promise<{ phone: string; delivery: string }> {
  const existingUser = await findMemberByPhone(input.phone);
  assertIntentAllowed(determineAuthIntent(existingUser, 'sign-in'), 'sign-in');

  if (isDevPhoneBypassEnabled()) return { phone: input.phone, delivery: 'dev-bypass' };

  const { error } = await supabase.auth.signInWithOtp({
    phone: input.phone,
    options: { shouldCreateUser: false },
  });
  if (error) throwSupabaseAuthError(error, ERROR_CODES.AUTH_OTP_SEND_FAILED);

  return { phone: input.phone, delivery: 'sms' };
}

export async function verifyMemberPasswordRecovery(
  supabase: SupabaseClient,
  input: MemberPasswordRecoveryVerifyInput,
): Promise<{ supabaseUserId: string }> {
  const existingUser = await findMemberByPhone(input.phone);
  assertIntentAllowed(determineAuthIntent(existingUser, 'sign-in'), 'sign-in');

  const { supabaseUserId } = isDevPhoneBypassEnabled()
    ? await verifyPhoneOtpWithDevBypass(supabase, { ...input, purpose: 'sign-in' })
    : await verifyPhoneOtpWithSupabase(supabase, input.phone, input.code);

  if (
    !existingUser?.supabase_auth_user_id ||
    supabaseUserId !== existingUser.supabase_auth_user_id
  ) {
    throw new AppError({
      code: ERROR_CODES.AUTH_SESSION_INVALID,
      message: 'Authenticated user does not match member account',
      status: 401,
    });
  }

  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) throwSupabaseAuthError(error, ERROR_CODES.AUTH_PASSWORD_INVALID);

  return { supabaseUserId };
}

async function verifyPhoneOtpWithSupabase(
  supabase: SupabaseClient,
  phone: string,
  code: string,
): Promise<{ supabaseUserId: string }> {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
  if (error || !data.user) {
    throw new AppError({
      code: ERROR_CODES.AUTH_OTP_INVALID,
      message: error?.message ?? 'Invalid or expired OTP code',
      status: 401,
      ...(error ? { details: { supabaseCode: error.code ?? 'unknown' } } : {}),
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
