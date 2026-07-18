import { describe, expect, test } from 'bun:test';

import {
  getDashboardAliasHref,
  getImplementedDashboardTabs,
  isDashboardTabLocked,
  normalizeDashboardTab,
} from '@/features/member/dashboard-tabs';
import type { UserContext } from '@kclub/contracts';

const memberCtx: UserContext = { isVip: false, hasBusiness: false, businessPublished: false };
const vipCtx: UserContext = { isVip: true, hasBusiness: false, businessPublished: false };
const businessCtx: UserContext = { isVip: false, hasBusiness: true, businessPublished: true };
const vipBusinessCtx: UserContext = { isVip: true, hasBusiness: true, businessPublished: true };

const BASE_TABS = ['overview', 'profile', 'settings', 'billing'] as const;
const WITH_BUSINESS_TABS = [
  'overview',
  'profile',
  'settings',
  'billing',
  'notifications',
  'inbox',
] as const;

describe('member dashboard tabs', () => {
  test('plain member sees base 4 tabs', () => {
    expect(getImplementedDashboardTabs(memberCtx)).toEqual(BASE_TABS);
  });

  test('VIP without business sees same base tabs', () => {
    expect(getImplementedDashboardTabs(vipCtx)).toEqual(BASE_TABS);
  });

  test('member with business sees all 6 tabs', () => {
    expect(getImplementedDashboardTabs(businessCtx)).toEqual(WITH_BUSINESS_TABS);
  });

  test('VIP with business sees all 6 tabs', () => {
    expect(getImplementedDashboardTabs(vipBusinessCtx)).toEqual(WITH_BUSINESS_TABS);
  });

  test('no tab is locked', () => {
    expect(isDashboardTabLocked(memberCtx, 'overview')).toBe(false);
    expect(isDashboardTabLocked(memberCtx, 'billing')).toBe(false);
  });

  test('normalizes invalid tab to first visible tab (overview)', () => {
    const tabs = getImplementedDashboardTabs(memberCtx);
    expect(normalizeDashboardTab('catalog', tabs)).toBe('overview');
    expect(normalizeDashboardTab(undefined, tabs)).toBe('overview');
  });

  test('maps legacy aliases to new tabs', () => {
    const tabs = getImplementedDashboardTabs(memberCtx);
    expect(normalizeDashboardTab('account', tabs)).toBe('overview');
    expect(normalizeDashboardTab('details', tabs)).toBe('overview');
    expect(normalizeDashboardTab('business', tabs)).toBe('profile');
    expect(normalizeDashboardTab('subscription', tabs)).toBe('billing');
  });

  test('keeps visible tab selection', () => {
    const tabs = getImplementedDashboardTabs(memberCtx);
    expect(normalizeDashboardTab('settings', tabs)).toBe('settings');
    expect(normalizeDashboardTab('billing', tabs)).toBe('billing');
  });

  test('falls back when hidden tab is requested', () => {
    const tabs = getImplementedDashboardTabs(memberCtx);
    expect(normalizeDashboardTab('notifications', tabs)).toBe('overview');
    expect(normalizeDashboardTab('inbox', tabs)).toBe('overview');
  });

  test('builds alias redirect hrefs', () => {
    expect(getDashboardAliasHref('en', 'overview')).toBe('/en/m/dashboard?tab=overview');
    expect(getDashboardAliasHref('uk', 'billing')).toBe('/uk/m/dashboard?tab=billing');
  });
});
