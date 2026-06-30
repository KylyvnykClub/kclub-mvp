import { type MemberDashboardTab, type UserContext } from '@kclub/contracts';
import { getVisibleDashboardTabs } from '@kclub/domain';

export const IMPLEMENTED_MEMBER_DASHBOARD_TABS = [
  'details',
  'subscription',
  'business',
  'introductions',
  'settings',
] as const satisfies readonly MemberDashboardTab[];

export type ImplementedMemberDashboardTab = (typeof IMPLEMENTED_MEMBER_DASHBOARD_TABS)[number];

const DEFAULT_TAB: ImplementedMemberDashboardTab = 'details';

const LEGACY_TAB_ALIASES: Record<string, ImplementedMemberDashboardTab> = {
  account: 'details',
  profile: 'details',
};

export function getImplementedDashboardTabs(
  ctx: UserContext,
): readonly ImplementedMemberDashboardTab[] {
  const visibleContractTabs = getVisibleDashboardTabs(ctx);

  return visibleContractTabs.filter((tab): tab is ImplementedMemberDashboardTab =>
    (IMPLEMENTED_MEMBER_DASHBOARD_TABS as readonly string[]).includes(tab),
  );
}

export function isDashboardTabLocked(
  _ctx: UserContext,
  _tab: ImplementedMemberDashboardTab,
): boolean {
  return false;
}

export function getDashboardTabLockLabel(_tab: ImplementedMemberDashboardTab): null {
  return null;
}

export function normalizeDashboardTab(
  tab: string | string[] | undefined,
  visibleTabs: readonly ImplementedMemberDashboardTab[],
): ImplementedMemberDashboardTab {
  const raw = Array.isArray(tab) ? tab[0] : tab;
  const value = raw ? (LEGACY_TAB_ALIASES[raw] ?? raw) : undefined;

  if (value && visibleTabs.includes(value as ImplementedMemberDashboardTab)) {
    return value as ImplementedMemberDashboardTab;
  }

  return visibleTabs[0] ?? DEFAULT_TAB;
}

export function getDashboardAliasHref(locale: string, tab: ImplementedMemberDashboardTab): string {
  return `/${locale}/m/dashboard?tab=${tab}`;
}
