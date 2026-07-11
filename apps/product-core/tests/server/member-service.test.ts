import { describe, expect, test } from 'bun:test';

import {
  assertMemberOnboardingComplete,
  isOnboardingComplete,
  toCurrentMemberProfileDto,
} from '../../src/server/services';

describe('isOnboardingComplete', () => {
  test('returns true when all fields are present', () => {
    expect(
      isOnboardingComplete({
        display_name: 'John',
        locale_preference: 'en',
        terms_accepted_at: new Date('2026-06-15'),
      }),
    ).toBe(true);
  });

  test('returns false when display_name is null', () => {
    expect(
      isOnboardingComplete({
        display_name: null,
        locale_preference: 'en',
        terms_accepted_at: new Date('2026-06-15'),
      }),
    ).toBe(false);
  });

  test('returns false when locale_preference is null', () => {
    expect(
      isOnboardingComplete({
        display_name: 'John',
        locale_preference: null,
        terms_accepted_at: new Date('2026-06-15'),
      }),
    ).toBe(false);
  });

  test('returns false when terms_accepted_at is null', () => {
    expect(
      isOnboardingComplete({
        display_name: 'John',
        locale_preference: 'en',
        terms_accepted_at: null,
      }),
    ).toBe(false);
  });

  test('returns false when all onboarding fields are null', () => {
    expect(
      isOnboardingComplete({
        display_name: null,
        locale_preference: null,
        terms_accepted_at: null,
      }),
    ).toBe(false);
  });
});

describe('toCurrentMemberProfileDto', () => {
  const baseUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    phone: '+15551234567',
    display_name: 'John Doe',
    email: null,
    locale_preference: 'en',
    membership_tier: 'MEMBER',
    status: 'ACTIVE',
    terms_accepted_at: new Date('2026-06-15T10:00:00.000Z'),
    country: null,
    city: null,
    about: null,
    avatar_url: null,
    created_at: new Date('2026-06-14T10:00:00.000Z'),
    updated_at: new Date('2026-06-15T10:00:00.000Z'),
  };

  test('maps user record to CurrentMemberProfileDto correctly', () => {
    const dto = toCurrentMemberProfileDto(baseUser);

    expect(dto).toEqual({
      id: '550e8400-e29b-41d4-a716-446655440000',
      phone: '+15551234567',
      displayName: 'John Doe',
      email: null,
      localePreference: 'en',
      membershipTier: 'MEMBER',
      status: 'ACTIVE',
      onboardingComplete: true,
      termsAcceptedAt: '2026-06-15T10:00:00.000Z',
      createdAt: '2026-06-14T10:00:00.000Z',
      updatedAt: '2026-06-15T10:00:00.000Z',
      country: null,
      city: null,
      about: null,
      avatarUrl: null,
    });
  });

  test('sets onboardingComplete false when terms_accepted_at is null', () => {
    const dto = toCurrentMemberProfileDto({ ...baseUser, terms_accepted_at: null });

    expect(dto.onboardingComplete).toBe(false);
    expect(dto.termsAcceptedAt).toBeNull();
  });

  test('maps membership tier and status correctly', () => {
    const dto = toCurrentMemberProfileDto({
      ...baseUser,
      membership_tier: 'VIP',
      status: 'BLOCKED',
    });

    expect(dto.membershipTier).toBe('VIP');
    expect(dto.status).toBe('BLOCKED');
  });

  test('does not expose supabase IDs or internal fields', () => {
    const dto = toCurrentMemberProfileDto(baseUser);

    const keys = Object.keys(dto);
    expect(keys).not.toContain('supabaseAuthUserId');
    expect(keys).not.toContain('supabase_auth_user_id');
  });
});

describe('assertMemberOnboardingComplete', () => {
  const fullyOnboardedUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    phone: '+15551234567',
    display_name: 'John Doe',
    email: null,
    locale_preference: 'en',
    membership_tier: 'MEMBER',
    status: 'ACTIVE',
    terms_accepted_at: new Date('2026-06-15T10:00:00.000Z'),
    country: null,
    city: null,
    about: null,
    avatar_url: null,
    created_at: new Date('2026-06-14T10:00:00.000Z'),
    updated_at: new Date('2026-06-15T10:00:00.000Z'),
  };

  test('does not throw when onboarding is complete', () => {
    expect(() => assertMemberOnboardingComplete(fullyOnboardedUser)).not.toThrow();
  });

  test('throws PERMISSION_DENIED (403) when display_name is null', () => {
    expect(() =>
      assertMemberOnboardingComplete({ ...fullyOnboardedUser, display_name: null }),
    ).toThrow(expect.objectContaining({ status: 403, code: 'PERMISSION_DENIED' }));
  });

  test('throws PERMISSION_DENIED (403) when locale_preference is null', () => {
    expect(() =>
      assertMemberOnboardingComplete({ ...fullyOnboardedUser, locale_preference: null }),
    ).toThrow(expect.objectContaining({ status: 403, code: 'PERMISSION_DENIED' }));
  });

  test('throws PERMISSION_DENIED (403) when terms_accepted_at is null', () => {
    expect(() =>
      assertMemberOnboardingComplete({ ...fullyOnboardedUser, terms_accepted_at: null }),
    ).toThrow(expect.objectContaining({ status: 403, code: 'PERMISSION_DENIED' }));
  });

  test('throws when all onboarding fields are missing', () => {
    expect(() =>
      assertMemberOnboardingComplete({
        ...fullyOnboardedUser,
        display_name: null,
        locale_preference: null,
        terms_accepted_at: null,
      }),
    ).toThrow(expect.objectContaining({ status: 403, code: 'PERMISSION_DENIED' }));
  });
});
