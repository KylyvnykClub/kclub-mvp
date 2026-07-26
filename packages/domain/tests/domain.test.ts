import {
  MEMBER_DASHBOARD_TABS,
  STAFF_ROLES,
  SUBSCRIPTION_STATUSES,
  type StaffPermission,
  type StaffRole,
} from '@kclub/contracts';
import { describe, expect, test } from 'vitest';

import {
  ACTIVE_CARD_MAX_PER_USER,
  FEATURED_RECOMMENDED_MAX,
  FEATURED_TOP_MAX,
  INTRODUCTIONS_PER_DAY_LIMIT,
  INTRODUCTIONS_PER_TARGET_PER_30_DAYS_LIMIT,
  INTRODUCTION_COOLDOWN_DAYS,
  INTRODUCTION_SINGLE_PENDING_PER_TARGET,
  canAccessDashboardTab,
  canCreateIntroductionForDay,
  canCreateIntroductionForTarget,
  canCreatePendingIntroduction,
  canFeatureBusiness,
  canIssueNewActiveCard,
  canSetFeaturedFlag,
  canSubmitIntroduction,
  canTransitionBusinessStatus,
  canTransitionCardStatus,
  getBusinessTransitionResult,
  getCardLifecycleState,
  getFeaturedSlotsRemaining,
  getMemberCapabilities,
  getUserContext,
  getVisibleDashboardTabs,
  hasActiveVipAccess,
  hasMemberCapability,
  hasStaffPermission,
  isStaffRoleAtLeast,
  shouldKeepExistingCardOnTierChange,
} from '../src';

describe('staff permission matrix', () => {
  const expected: Record<StaffRole, Record<StaffPermission, boolean>> = {
    OWNER: {
      DASHBOARD_METRICS_READ: true,
      FINANCE_METRICS_READ: true,
      USERS_READ: true,
      USERS_BLOCK: true,
      CARDS_READ: true,
      CARDS_REISSUE: true,
      CARDS_REVOKE: true,
      SUBSCRIPTIONS_READ: true,
      SUBSCRIPTIONS_CANCEL_ADMIN: true,
      BUSINESSES_MODERATE: true,
      INTRODUCTIONS_MODERATE: true,
      TAXONOMY_MANAGE: true,
      FEATURED_BUSINESSES_MANAGE: true,
      STRIPE_PRICES_MANAGE: true,
      STAFF_MANAGE: true,
      AUDIT_READ: true,
      INTERNAL_NOTES_CREATE: true,
    },
    ADMIN: {
      DASHBOARD_METRICS_READ: true,
      FINANCE_METRICS_READ: true,
      USERS_READ: true,
      USERS_BLOCK: true,
      CARDS_READ: true,
      CARDS_REISSUE: true,
      CARDS_REVOKE: true,
      SUBSCRIPTIONS_READ: true,
      SUBSCRIPTIONS_CANCEL_ADMIN: true,
      BUSINESSES_MODERATE: true,
      INTRODUCTIONS_MODERATE: true,
      TAXONOMY_MANAGE: true,
      FEATURED_BUSINESSES_MANAGE: true,
      STRIPE_PRICES_MANAGE: false,
      STAFF_MANAGE: false,
      AUDIT_READ: true,
      INTERNAL_NOTES_CREATE: true,
    },
    MODERATOR: {
      DASHBOARD_METRICS_READ: true,
      FINANCE_METRICS_READ: false,
      USERS_READ: false,
      USERS_BLOCK: false,
      CARDS_READ: false,
      CARDS_REISSUE: false,
      CARDS_REVOKE: false,
      SUBSCRIPTIONS_READ: true,
      SUBSCRIPTIONS_CANCEL_ADMIN: false,
      BUSINESSES_MODERATE: true,
      INTRODUCTIONS_MODERATE: true,
      TAXONOMY_MANAGE: true,
      FEATURED_BUSINESSES_MANAGE: true,
      STRIPE_PRICES_MANAGE: false,
      STAFF_MANAGE: false,
      AUDIT_READ: false,
      INTERNAL_NOTES_CREATE: true,
    },
  };

  for (const role of STAFF_ROLES) {
    test(`${role} permission matrix matches spec`, () => {
      for (const [permission, allowed] of Object.entries(expected[role]) as [
        StaffPermission,
        boolean,
      ][]) {
        expect(hasStaffPermission(role, permission)).toBe(allowed);
      }
    });
  }

  test('role ranking only applies to hierarchical staff roles', () => {
    expect(isStaffRoleAtLeast('OWNER', 'ADMIN')).toBe(true);
    expect(isStaffRoleAtLeast('ADMIN', 'MODERATOR')).toBe(true);
    expect(isStaffRoleAtLeast('MODERATOR', 'ADMIN')).toBe(false);
  });
});

describe('member capability policies', () => {
  test('vip access remains active through canceled and past_due periods', () => {
    expect(hasActiveVipAccess('ACTIVE')).toBe(true);
    expect(hasActiveVipAccess('CANCELED')).toBe(true);
    expect(hasActiveVipAccess('PAST_DUE')).toBe(true);
    expect(hasActiveVipAccess('EXPIRED')).toBe(false);
    expect(hasActiveVipAccess('NONE')).toBe(false);
  });

  test('getUserContext derives correct flags from subscription and business status', () => {
    expect(getUserContext({ subscriptionStatus: 'NONE' })).toEqual({
      isVip: false,
      hasBusiness: false,
      businessPublished: false,
    });
    expect(getUserContext({ subscriptionStatus: 'ACTIVE' })).toEqual({
      isVip: true,
      hasBusiness: false,
      businessPublished: false,
    });
    expect(
      getUserContext({ subscriptionStatus: 'CANCELED', businessStatus: 'UNDER_REVIEW' }),
    ).toEqual({
      isVip: true,
      hasBusiness: true,
      businessPublished: false,
    });
    expect(getUserContext({ subscriptionStatus: 'NONE', businessStatus: 'PUBLISHED' })).toEqual({
      isVip: false,
      hasBusiness: true,
      businessPublished: true,
    });
  });

  test('dashboard tabs follow VIP and submitted-business visibility', () => {
    const baseTabs = ['details', 'settings'] as const;
    const member = getUserContext({ subscriptionStatus: 'NONE' });
    const vip = getUserContext({ subscriptionStatus: 'ACTIVE' });
    const memberWithBusiness = getUserContext({
      subscriptionStatus: 'NONE',
      businessStatus: 'APPROVED',
    });
    const vipWithBusiness = getUserContext({
      subscriptionStatus: 'ACTIVE',
      businessStatus: 'PUBLISHED',
    });

    const vipTabs = ['details', 'settings', 'introductions'] as const;
    const businessTabs = ['details', 'business', 'settings'] as const;
    const vipBusinessTabs = businessTabs;

    expect(getVisibleDashboardTabs(member)).toEqual(baseTabs);
    expect(getVisibleDashboardTabs(vip)).toEqual(vipTabs);
    expect(getVisibleDashboardTabs(memberWithBusiness)).toEqual(businessTabs);
    expect(getVisibleDashboardTabs(vipWithBusiness)).toEqual(vipBusinessTabs);

    expect(canAccessDashboardTab(member, 'business')).toBe(false);
    expect(canAccessDashboardTab(member, 'introductions')).toBe(false);
    expect(canAccessDashboardTab(vip, 'introductions')).toBe(true);
    expect(canAccessDashboardTab(vip, 'business')).toBe(false);
    expect(canAccessDashboardTab(memberWithBusiness, 'business')).toBe(true);
    expect(canAccessDashboardTab(memberWithBusiness, 'audit')).toBe(false);
    expect(canAccessDashboardTab(memberWithBusiness, 'introductions')).toBe(false);
    expect(canAccessDashboardTab(vipWithBusiness, 'introductions')).toBe(false);
  });

  test('introduction requires VIP; business submit requires no existing business', () => {
    const member = getUserContext({ subscriptionStatus: 'NONE' });
    const vip = getUserContext({ subscriptionStatus: 'ACTIVE' });
    const vipWithBusiness = getUserContext({
      subscriptionStatus: 'ACTIVE',
      businessStatus: 'PUBLISHED',
    });

    expect(canSubmitIntroduction(member)).toBe(false);
    expect(canSubmitIntroduction(vip)).toBe(true);
    expect(canSubmitIntroduction(vipWithBusiness)).toBe(true);

    expect(hasMemberCapability(member, 'BUSINESS_SUBMIT')).toBe(true);
    expect(hasMemberCapability(vipWithBusiness, 'BUSINESS_SUBMIT')).toBe(false);
    expect(hasMemberCapability(vip, 'INTRODUCTIONS_SUBMIT')).toBe(true);
    expect(hasMemberCapability(member, 'INTRODUCTIONS_SUBMIT')).toBe(false);
  });

  test('all tab ids remain representable through the policy layer', () => {
    for (const tab of MEMBER_DASHBOARD_TABS) {
      expect(typeof tab).toBe('string');
    }
    expect(getMemberCapabilities(getUserContext({ subscriptionStatus: 'NONE' }))).toContain(
      'BUSINESS_SUBMIT' as never,
    );
    expect(
      getMemberCapabilities(
        getUserContext({ subscriptionStatus: 'NONE', businessStatus: 'APPROVED' }),
      ),
    ).not.toContain('BUSINESS_SUBMIT' as never);
  });

  test('subscription status enum assumptions remain covered', () => {
    expect(SUBSCRIPTION_STATUSES).toEqual(['NONE', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED']);
  });
});

describe('business status policies', () => {
  test('only MVP business transitions are allowed', () => {
    expect(canTransitionBusinessStatus('UNDER_REVIEW', 'APPROVED')).toBe(true);
    expect(canTransitionBusinessStatus('UNDER_REVIEW', 'REJECTED')).toBe(true);
    expect(canTransitionBusinessStatus('APPROVED', 'PUBLISHED')).toBe(true);
    expect(canTransitionBusinessStatus('APPROVED', 'REJECTED')).toBe(true);
    expect(canTransitionBusinessStatus('PUBLISHED', 'HIDDEN')).toBe(true);

    expect(canTransitionBusinessStatus('HIDDEN', 'PUBLISHED')).toBe(true);

    expect(canTransitionBusinessStatus('UNDER_REVIEW', 'PUBLISHED')).toBe(false);
    expect(canTransitionBusinessStatus('PUBLISHED', 'APPROVED')).toBe(false);
    expect(canTransitionBusinessStatus('REJECTED', 'UNDER_REVIEW')).toBe(false);
  });

  test('transition results reset featured flags when leaving published', () => {
    expect(getBusinessTransitionResult('PUBLISHED', 'HIDDEN')).toEqual({
      allowed: true,
      resetsFeaturedFlags: true,
    });
    expect(getBusinessTransitionResult('APPROVED', 'PUBLISHED')).toEqual({
      allowed: true,
      resetsFeaturedFlags: false,
    });
  });

  test('featured business limits and rules stay capped', () => {
    expect(canFeatureBusiness('PUBLISHED')).toBe(true);
    expect(canFeatureBusiness('APPROVED')).toBe(false);
    expect(FEATURED_TOP_MAX).toBe(3);
    expect(FEATURED_RECOMMENDED_MAX).toBe(3);
    expect(getFeaturedSlotsRemaining(0, 2)).toEqual({
      topRemaining: 3,
      recommendedRemaining: 1,
    });
    expect(canSetFeaturedFlag('PUBLISHED', true, 2, FEATURED_TOP_MAX)).toBe(true);
    expect(canSetFeaturedFlag('PUBLISHED', true, 3, FEATURED_TOP_MAX)).toBe(false);
    expect(canSetFeaturedFlag('APPROVED', true, 0, FEATURED_TOP_MAX)).toBe(false);
    expect(canSetFeaturedFlag('APPROVED', false, 3, FEATURED_TOP_MAX)).toBe(true);
  });
});

describe('card policies', () => {
  test('card lifecycle transitions follow the MVP rules', () => {
    expect(canTransitionCardStatus('ACTIVE', 'REVOKED')).toBe(true);
    expect(canTransitionCardStatus('ACTIVE', 'EXPIRED')).toBe(true);
    expect(canTransitionCardStatus('REVOKED', 'ACTIVE')).toBe(false);
    expect(canTransitionCardStatus('EXPIRED', 'ACTIVE')).toBe(false);
  });

  test('member to vip keeps the existing card by default and active-card invariant stays explicit', () => {
    expect(shouldKeepExistingCardOnTierChange('MEMBER', 'VIP')).toBe(true);
    expect(shouldKeepExistingCardOnTierChange('VIP', 'MEMBER')).toBe(false);
    expect(ACTIVE_CARD_MAX_PER_USER).toBe(1);
    expect(canIssueNewActiveCard(0)).toBe(true);
    expect(canIssueNewActiveCard(1)).toBe(false);
    expect(getCardLifecycleState('ACTIVE')).toEqual({
      isActive: true,
      isTerminal: false,
    });
    expect(getCardLifecycleState('REVOKED')).toEqual({
      isActive: false,
      isTerminal: true,
    });
  });
});

describe('introduction policies', () => {
  test('rate limits and cooldown constants match the spec defaults', () => {
    expect(INTRODUCTIONS_PER_DAY_LIMIT).toBe(10);
    expect(INTRODUCTIONS_PER_TARGET_PER_30_DAYS_LIMIT).toBe(3);
    expect(INTRODUCTION_COOLDOWN_DAYS).toBe(30);
    expect(INTRODUCTION_SINGLE_PENDING_PER_TARGET).toBe(1);
  });

  test('introduction limit helpers enforce the caps', () => {
    expect(canCreateIntroductionForDay(9)).toBe(true);
    expect(canCreateIntroductionForDay(10)).toBe(false);
    expect(canCreateIntroductionForTarget(2)).toBe(true);
    expect(canCreateIntroductionForTarget(3)).toBe(false);
    expect(canCreatePendingIntroduction(0)).toBe(true);
    expect(canCreatePendingIntroduction(1)).toBe(false);
  });
});
