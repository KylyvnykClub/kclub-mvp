import type { SupabaseClient } from '@supabase/supabase-js';

import { ERROR_CODES } from '@kclub/contracts';

import { AppError } from '@/server/errors';
import { getDbClient, schema } from '@/server/db';
import { eq, sql } from 'drizzle-orm';

import { createSupabaseServiceClient } from './supabase';
import {
  getDevPhoneBypassOtp,
  getPhoneLookupCandidates,
  isValidDevPhoneBypassOtp,
  phonesMatch,
  toDevBypassEmail,
} from './dev-phone-bypass-config';

export {
  getDevPhoneBypassOtp,
  isDevPhoneBypassEnabled,
  isValidDevPhoneBypassOtp,
  toDevBypassEmail,
} from './dev-phone-bypass-config';

async function findAuthUserIdByPhoneInDatabase(phone: string): Promise<string | null> {
  const db = getDbClient();
  const candidates = getPhoneLookupCandidates(phone);

  for (const candidate of candidates) {
    const rows = await db.execute(sql`
      SELECT id::text AS id
      FROM auth.users
      WHERE phone = ${candidate}
      LIMIT 1
    `);

    if (rows[0]?.id) {
      return rows[0].id as string;
    }
  }

  return null;
}

async function findSupabaseUserIdByPhone(
  admin: SupabaseClient,
  phone: string,
): Promise<string | null> {
  const dbMatch = await findAuthUserIdByPhoneInDatabase(phone);
  if (dbMatch) {
    return dbMatch;
  }

  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || data.users.length === 0) {
      return null;
    }

    const match = data.users.find((user) => phonesMatch(user.phone, phone));
    if (match) {
      return match.id;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function resolveSupabaseAuthUserId(
  phone: string,
  purpose: 'sign-in' | 'sign-up',
): Promise<string> {
  const db = getDbClient();
  const admin = createSupabaseServiceClient();

  const member = await db.query.users.findFirst({
    where: eq(schema.users.phone, phone),
    columns: { supabase_auth_user_id: true },
  });

  if (member?.supabase_auth_user_id) {
    return member.supabase_auth_user_id;
  }

  const existingAuthUserId = await findSupabaseUserIdByPhone(admin, phone);
  if (existingAuthUserId) {
    return existingAuthUserId;
  }

  if (purpose === 'sign-in') {
    throw new AppError({
      code: ERROR_CODES.AUTH_OTP_INVALID,
      message: 'No linked Supabase auth user found for this phone',
      status: 401,
    });
  }

  const devEmail = toDevBypassEmail(phone);
  const { data, error } = await admin.auth.admin.createUser({
    phone,
    phone_confirm: true,
    email: devEmail,
    email_confirm: true,
  });

  if (error) {
    const existingId = await findSupabaseUserIdByPhone(admin, phone);
    if (existingId) {
      return existingId;
    }

    throw new AppError({
      code: ERROR_CODES.AUTH_OTP_SEND_FAILED,
      message: error.message,
      status: 400,
      details: { supabaseCode: error.code ?? undefined },
    });
  }

  return data.user.id;
}

async function verifyGeneratedLinkSession(
  supabase: SupabaseClient,
  hashedToken: string,
): Promise<void> {
  const otpTypes = ['email', 'magiclink'] as const;

  for (const otpType of otpTypes) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: hashedToken,
      type: otpType,
    });

    if (!error) {
      return;
    }
  }

  throw new AppError({
    code: ERROR_CODES.AUTH_OTP_INVALID,
    message: 'Unable to establish dev bypass auth session',
    status: 401,
  });
}

export async function establishDevPhoneBypassSession(
  supabase: SupabaseClient,
  supabaseUserId: string,
  phone: string,
): Promise<void> {
  const admin = createSupabaseServiceClient();
  const devEmail = toDevBypassEmail(phone);

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(supabaseUserId);
  if (userError || !userData.user) {
    throw new AppError({
      code: ERROR_CODES.AUTH_OTP_INVALID,
      message: userError?.message ?? 'Unable to load Supabase auth user for dev bypass',
      status: 401,
    });
  }

  let linkEmail = userData.user.email ?? devEmail;
  if (!userData.user.email) {
    const { error: updateError } = await admin.auth.admin.updateUserById(supabaseUserId, {
      email: devEmail,
      email_confirm: true,
    });

    if (updateError) {
      throw new AppError({
        code: ERROR_CODES.AUTH_OTP_INVALID,
        message: updateError.message,
        status: 401,
      });
    }

    linkEmail = devEmail;
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: linkEmail,
  });

  const hashedToken = linkData?.properties?.hashed_token;
  if (linkError || !hashedToken) {
    throw new AppError({
      code: ERROR_CODES.AUTH_OTP_INVALID,
      message: linkError?.message ?? 'Unable to create dev bypass auth session',
      status: 401,
    });
  }

  await verifyGeneratedLinkSession(supabase, hashedToken);
}

export async function createDevPhoneBypassUser(phone: string, password: string): Promise<void> {
  const admin = createSupabaseServiceClient();
  const existingUserId = await findSupabaseUserIdByPhone(admin, phone);

  if (existingUserId) {
    const { error } = await admin.auth.admin.updateUserById(existingUserId, {
      password,
      phone_confirm: true,
    });
    if (error) {
      throw new AppError({
        code: ERROR_CODES.AUTH_OTP_SEND_FAILED,
        message: error.message,
        status: 400,
        details: { supabaseCode: error.code ?? undefined },
      });
    }
    return;
  }

  const { error } = await admin.auth.admin.createUser({
    phone,
    password,
    phone_confirm: true,
    email: toDevBypassEmail(phone),
    email_confirm: true,
  });
  if (error) {
    throw new AppError({
      code: ERROR_CODES.AUTH_OTP_SEND_FAILED,
      message: error.message,
      status: 400,
      details: { supabaseCode: error.code ?? undefined },
    });
  }
}

export async function verifyPhoneOtpWithDevBypass(
  supabase: SupabaseClient,
  input: {
    phone: string;
    code: string;
    purpose: 'sign-in' | 'sign-up';
  },
): Promise<{ supabaseUserId: string }> {
  if (!isValidDevPhoneBypassOtp(input.code)) {
    throw new AppError({
      code: ERROR_CODES.AUTH_OTP_INVALID,
      message: `Invalid dev bypass OTP. Use ${getDevPhoneBypassOtp()} when local phone bypass is enabled.`,
      status: 401,
    });
  }

  const supabaseUserId = await resolveSupabaseAuthUserId(input.phone, input.purpose);
  await establishDevPhoneBypassSession(supabase, supabaseUserId, input.phone);

  return { supabaseUserId };
}
