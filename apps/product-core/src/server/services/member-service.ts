import {
  ERROR_CODES,
  type CurrentMemberProfileDto,
  type IsoDateTime,
  type Locale,
  type MemberTier,
  type UserStatus,
} from '@kclub/contracts';
import type { MemberOnboardingInput, MemberProfileUpdateInput } from '@kclub/validation';

import { AppError } from '@/server/errors';
import { eq } from 'drizzle-orm';
import { getDbClient, schema } from '@/server/db';

export type UserRecord = {
  id: string;
  phone: string;
  display_name: string | null;
  email: string | null;
  locale_preference: string | null;
  membership_tier: string;
  status: string;
  terms_accepted_at: Date | null;
  country: string | null;
  city: string | null;
  about: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
};

export function isOnboardingComplete(user: {
  display_name: string | null;
  locale_preference: string | null;
  terms_accepted_at: Date | null;
}): boolean {
  return !!(user.display_name && user.locale_preference && user.terms_accepted_at);
}

export function assertMemberOnboardingComplete(user: UserRecord): void {
  if (!isOnboardingComplete(user)) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'Onboarding must be completed before this action',
      status: 403,
    });
  }
}

export function toCurrentMemberProfileDto(user: UserRecord): CurrentMemberProfileDto {
  return {
    id: user.id,
    phone: user.phone,
    displayName: user.display_name,
    email: user.email,
    localePreference: user.locale_preference as Locale | null,
    membershipTier: user.membership_tier as MemberTier,
    status: user.status as UserStatus,
    onboardingComplete: isOnboardingComplete(user),
    termsAcceptedAt: user.terms_accepted_at?.toISOString() ?? null,
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at.toISOString(),
    country: user.country,
    city: user.city,
    about: user.about,
    avatarUrl: user.avatar_url,
  };
}

export async function getMemberBySupabaseUserId(supabaseUserId: string): Promise<UserRecord> {
  const db = getDbClient();

  const user = (await db.query.users.findFirst({
    where: eq(schema.users.supabase_auth_user_id, supabaseUserId),
  })) as UserRecord | undefined;

  if (!user) {
    throw new AppError({
      code: ERROR_CODES.AUTH_SESSION_REQUIRED,
      message: 'User session not found',
      status: 401,
    });
  }

  if (user.status === 'BLOCKED') {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'Account is blocked',
      status: 403,
    });
  }

  return user;
}

export async function updateMemberProfile(
  supabaseUserId: string,
  input: MemberProfileUpdateInput,
): Promise<UserRecord> {
  const db = getDbClient();

  const user = await getMemberBySupabaseUserId(supabaseUserId);

  const data: Record<string, string | null> = {};

  if (input.displayName !== undefined) data.display_name = input.displayName;
  if (input.localePreference !== undefined) data.locale_preference = input.localePreference;
  if (input.country !== undefined) data.country = input.country ?? null;
  if (input.city !== undefined) data.city = input.city ?? null;
  if (input.about !== undefined) data.about = input.about ?? null;
  if (input.avatarUrl !== undefined) data.avatar_url = input.avatarUrl ?? null;

  const [updated] = await db
    .update(schema.users)
    .set(data)
    .where(eq(schema.users.id, user.id))
    .returning();

  return updated as UserRecord;
}

export async function completeMemberOnboarding(
  supabaseUserId: string,
  input: MemberOnboardingInput,
): Promise<UserRecord> {
  const db = getDbClient();

  const user = await getMemberBySupabaseUserId(supabaseUserId);

  if (user.phone !== input.phone) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_INVALID_INPUT,
      message: 'Phone does not match authenticated user',
      status: 400,
    });
  }

  const [updated] = await db
    .update(schema.users)
    .set({
      display_name: input.displayName,
      email: input.email ?? null,
      locale_preference: input.localePreference,
      terms_accepted_at: new Date(),
    })
    .where(eq(schema.users.id, user.id))
    .returning();

  return updated as UserRecord;
}
