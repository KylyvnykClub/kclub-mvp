import type { CurrentMemberProfileDto, Locale, MemberTier, UserStatus } from '@kclub/contracts';

import {
  makeEntityId,
  makeIsoDate,
  makePhone,
  nextSequence,
  type FactoryOverrides,
  withOverrides,
} from './shared';

export type TestMemberUser = CurrentMemberProfileDto & {
  activeCardId: string | null;
};

export function createMemberUser(overrides?: FactoryOverrides<TestMemberUser>): TestMemberUser {
  const sequence = nextSequence('member-user');
  const createdAt = makeIsoDate(sequence);
  const localePreference: Locale = 'en';
  const membershipTier: MemberTier = 'MEMBER';
  const status: UserStatus = 'ACTIVE';

  return withOverrides(
    {
      id: makeEntityId('member', sequence),
      phone: makePhone(sequence),
      displayName: `Member ${sequence}`,
      localePreference,
      membershipTier,
      status,
      onboardingComplete: true,
      termsAcceptedAt: createdAt,
      country: null,
      city: null,
      about: null,
      avatarUrl: null,
      createdAt,
      updatedAt: createdAt,
      activeCardId: null,
    },
    overrides,
  );
}

export function createIncompleteMemberUser(
  overrides?: FactoryOverrides<TestMemberUser>,
): TestMemberUser {
  const base = createMemberUser({
    displayName: null,
    onboardingComplete: false,
    termsAcceptedAt: null,
  });

  return withOverrides(base, overrides);
}
