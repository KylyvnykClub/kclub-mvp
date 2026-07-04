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

const BASE_TABS = ['details', 'subscription', 'settings'] as const;

describe('member dashboard tabs', () => {
  test('plain member sees base 3 tabs', () => {
    expect(getImplementedDashboardTabs(memberCtx)).toEqual(BASE_TABS);
  });

  test('VIP sees base tabs + introductions + business', () => {
    expect(getImplementedDashboardTabs(vipCtx)).toEqual([...BASE_TABS, 'introductions', 'business']);
  });

  test('member with business (not VIP) sees only base tabs', () => {
    expect(getImplementedDashboardTabs(businessCtx)).toEqual(BASE_TABS);
  });

  test('VIP with business sees base tabs + introductions + business', () => {
    expect(getImplementedDashboardTabs(vipBusinessCtx)).toEqual([...BASE_TABS, 'introductions', 'business']);
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
