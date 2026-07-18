import { describe, expect, test } from 'vitest';

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

const BASE_TABS = ['details', 'subscription', 'settings'] as const;

describe('member dashboard tabs', () => {
  test('plain member sees base 3 tabs', () => {
    expect(getImplementedDashboardTabs(memberCtx)).toEqual(BASE_TABS);
  });

  test('VIP without business sees subscription and introductions, not business', () => {
    expect(getImplementedDashboardTabs(vipCtx)).toEqual([
      'details',
      'subscription',
      'settings',
      'introductions',
    ]);
  });

  test('member with business sees business instead of subscription', () => {
    expect(getImplementedDashboardTabs(businessCtx)).toEqual(['details', 'business', 'settings']);
  });

  test('VIP with business sees business, not subscription or introductions', () => {
    expect(getImplementedDashboardTabs(vipBusinessCtx)).toEqual([
      'details',
      'business',
      'settings',
    ]);
  });

  test('no tab is locked', () => {
    expect(isDashboardTabLocked(memberCtx, 'details')).toBe(false);
    expect(isDashboardTabLocked(memberCtx, 'subscription')).toBe(false);
  });

  test('normalizes invalid tab to first visible tab (details)', () => {
    const tabs = getImplementedDashboardTabs(memberCtx);
    expect(normalizeDashboardTab('catalog', tabs)).toBe('details');
    expect(normalizeDashboardTab(undefined, tabs)).toBe('details');
  });

  test('maps legacy account and profile tabs to details', () => {
    const tabs = getImplementedDashboardTabs(memberCtx);
    expect(normalizeDashboardTab('account', tabs)).toBe('details');
    expect(normalizeDashboardTab('profile', tabs)).toBe('details');
  });

  test('keeps visible tab selection', () => {
    const tabs = getImplementedDashboardTabs(memberCtx);
    expect(normalizeDashboardTab('settings', tabs)).toBe('settings');
    expect(normalizeDashboardTab('subscription', tabs)).toBe('subscription');
  });

  test('falls back when VIP without business requests hidden business tab', () => {
    const tabs = getImplementedDashboardTabs(vipCtx);
    expect(normalizeDashboardTab('business', tabs)).toBe('details');
  });

  test('falls back when legacy audit or permissions tab is requested', () => {
    const tabs = getImplementedDashboardTabs(memberCtx);
    expect(normalizeDashboardTab('audit', tabs)).toBe('details');
    expect(normalizeDashboardTab('permissions', tabs)).toBe('details');
  });

  test('builds alias redirect hrefs', () => {
    expect(getDashboardAliasHref('en', 'details')).toBe('/en/m/dashboard?tab=details');
    expect(getDashboardAliasHref('uk', 'subscription')).toBe('/uk/m/dashboard?tab=subscription');
  });
});
