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
import { getDbClient, schema } from '@/server/db';
import { eq } from 'drizzle-orm';

export type UserRecord = typeof schema.users.$inferSelect;

export function isOnboardingComplete(user: {
  displayName: string | null;
  localePreference: string | null;
  termsAcceptedAt: Date | null;
}): boolean {
  return !!(user.displayName && user.localePreference && user.termsAcceptedAt);
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
    displayName: user.displayName,
    localePreference: user.localePreference as Locale | null,
    membershipTier: user.membershipTier as MemberTier,
    status: user.status as UserStatus,
    onboardingComplete: isOnboardingComplete(user),
    termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    country: user.country,
    city: user.city,
    about: user.about,
    avatarUrl: user.avatarUrl,
  };
}

export async function getMemberBySupabaseUserId(supabaseUserId: string): Promise<UserRecord> {
  const db = getDbClient();

  const user = await db.query.users.findFirst({
    where: eq(schema.users.supabaseAuthUserId, supabaseUserId),
  });

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

  const data: Partial<UserRecord> = {};

  if (input.displayName !== undefined) data.displayName = input.displayName;
  if (input.localePreference !== undefined) data.localePreference = input.localePreference;
  if (input.country !== undefined) data.country = input.country ?? null;
  if (input.city !== undefined) data.city = input.city ?? null;
  if (input.about !== undefined) data.about = input.about ?? null;
  if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl ?? null;

  const [updated] = await db
    .update(schema.users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id))
    .returning();

  return updated;
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
      displayName: input.displayName,
      localePreference: input.localePreference,
      termsAcceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id))
    .returning();

  return updated;
}
