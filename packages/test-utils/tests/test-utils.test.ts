import { createApiError, createApiSuccess } from '@kclub/contracts';
import { hasStaffPermission } from '@kclub/domain';
import { beforeEach, describe, expect, test } from 'bun:test';

import {
  ALL_MEMBER_DASHBOARD_TABS_FIXTURE,
  BUSINESS_PROFILE_BY_STATUS,
  MEMBER_PERMISSION_FIXTURES,
  STAFF_PERMISSION_MATRIX_FIXTURE,
  assertAdminBusinessDtoIncludesModerationFields,
  assertApiEnvelopeShape,
  assertApiErrorEnvelope,
  assertApiSuccessEnvelope,
  assertKnownErrorCode,
  assertKnownPublicBusinessDtoKeys,
  assertPublicBusinessDtoExcludesAdminFields,
  createBusinessProfileForStatus,
  createCard,
  createIncompleteMemberUser,
  createIntroduction,
  createMemberUser,
  createStaffUser,
  createStripeWebhookEvent,
  createVipSubscription,
  isKnownErrorCode,
  resetFactorySequences,
} from '../src';

describe('factories', () => {
  beforeEach(() => {
    resetFactorySequences();
  });

  test('creates deterministic member, staff, card, subscription, introduction, and stripe fixtures', () => {
    const member = createMemberUser();
    const staff = createStaffUser();
    const card = createCard({ membershipTier: 'VIP' });
    const subscription = createVipSubscription();
    const introduction = createIntroduction();
    const event = createStripeWebhookEvent();

    expect(member.id).toBe('member-0001');
    expect(staff.id).toBe('staff-0001');
    expect(card.cardNumber).toBe('VIP-000001');
    expect(subscription.stripeSubscriptionId).toBe('sub_00000001');
    expect(introduction.id).toBe('introduction-0001');
    expect(event.id).toBe('evt_00000001');
  });

  test('supports easy overrides and incomplete-member variants', () => {
    const member = createIncompleteMemberUser({
      displayName: 'Needs onboarding',
      localePreference: 'uk',
    });
    const card = createCard({
      userId: member.id,
      membershipTier: member.membershipTier,
    });

    expect(member.onboardingComplete).toBe(false);
    expect(member.termsAcceptedAt).toBeNull();
    expect(member.displayName).toBe('Needs onboarding');
    expect(card.userId).toBe(member.id);
  });

  test('covers every business status with realistic moderation fields', () => {
    const statuses = Object.keys(BUSINESS_PROFILE_BY_STATUS) as Array<
      keyof typeof BUSINESS_PROFILE_BY_STATUS
    >;

    for (const status of statuses) {
      const business = BUSINESS_PROFILE_BY_STATUS[status]();
      expect(business.status).toBe(status);
    }

    const hiddenBusiness = createBusinessProfileForStatus('HIDDEN');
    expect(hiddenBusiness.hiddenAt).not.toBeNull();
    expect(hiddenBusiness.publishedAt).toBeNull();
  });
});

describe('contract assertions', () => {
  test('asserts api envelope shapes for success and error responses', () => {
    const success = createApiSuccess({ ok: true }, { timestamp: '2026-06-14T12:00:00.000Z' });
    const error = createApiError({
      code: 'VALIDATION_INVALID_INPUT',
      message: 'Invalid input',
    });

    expect(() => assertApiEnvelopeShape(success)).not.toThrow();
    expect(() => assertApiSuccessEnvelope(success)).not.toThrow();
    expect(() => assertApiErrorEnvelope(error)).not.toThrow();
  });

  test('catches dto boundary regressions and validates known public keys', () => {
    const adminBusiness = createBusinessProfileForStatus('PUBLISHED');
    const publicBusiness = {
      id: adminBusiness.id,
      slug: adminBusiness.slug,
      name: adminBusiness.name,
      categoryName: adminBusiness.categoryName,
      countryName: adminBusiness.countryName,
      cityName: adminBusiness.cityName,
      briefDescription: adminBusiness.briefDescription,
      websiteUrl: adminBusiness.websiteUrl,
      socialUrl: adminBusiness.socialUrl,
      featuredTop: adminBusiness.featuredTop,
      featuredRecommended: adminBusiness.featuredRecommended,
      description: adminBusiness.description,
      representativeName: adminBusiness.representativeName,
      publishedAt: adminBusiness.publishedAt,
    };

    expect(() => assertPublicBusinessDtoExcludesAdminFields(publicBusiness)).not.toThrow();
    expect(() => assertKnownPublicBusinessDtoKeys(publicBusiness)).not.toThrow();
    expect(() => assertAdminBusinessDtoIncludesModerationFields(adminBusiness)).not.toThrow();
  });

  test('validates error-code membership', () => {
    expect(isKnownErrorCode('VIP_REQUIRED')).toBe(true);
    expect(isKnownErrorCode('NOT_A_REAL_ERROR')).toBe(false);
    expect(() => assertKnownErrorCode('AUTH_SESSION_REQUIRED')).not.toThrow();
    expect(() => assertKnownErrorCode('NOT_A_REAL_ERROR')).toThrow('Unknown error code');
  });
});

describe('permission fixtures', () => {
  test('derive the staff permission matrix from domain policy helpers', () => {
    expect(STAFF_PERMISSION_MATRIX_FIXTURE.OWNER.STRIPE_PRICES_MANAGE).toBe(true);
    expect(STAFF_PERMISSION_MATRIX_FIXTURE.MODERATOR.STAFF_MANAGE).toBe(false);

    for (const [role, permissions] of Object.entries(STAFF_PERMISSION_MATRIX_FIXTURE)) {
      for (const [permission, allowed] of Object.entries(permissions)) {
        expect(
          hasStaffPermission(
            role as keyof typeof STAFF_PERMISSION_MATRIX_FIXTURE,
            permission as never,
          ),
        ).toBe(allowed);
      }
    }
  });

  test('exposes member capability fixtures and stable dashboard tabs', () => {
    expect(MEMBER_PERMISSION_FIXTURES.MEMBER.visibleTabs).toEqual([
      'overview',
      'profile',
      'settings',
      'billing',
    ]);
    expect(MEMBER_PERMISSION_FIXTURES.VIP.capabilities).toContain('BUSINESS_SUBMIT');
    expect(MEMBER_PERMISSION_FIXTURES.HAS_BUSINESS.visibleTabs).toContain('notifications');
    expect(MEMBER_PERMISSION_FIXTURES.HAS_BUSINESS.visibleTabs).toContain('inbox');
    expect(ALL_MEMBER_DASHBOARD_TABS_FIXTURE).toContain('settings');
  });
});
