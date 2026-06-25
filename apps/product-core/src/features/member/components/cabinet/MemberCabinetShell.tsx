'use client';

import Link from 'next/link';

import type { CurrentMemberProfileDto, UserContext } from '@kclub/contracts';
import { cn } from '@kclub/ui';

import type { Locale } from '@/i18n/routing';
import type { ImplementedMemberDashboardTab } from '@/features/member/dashboard-tabs';
import {
  getDashboardTabLockLabel,
  isDashboardTabLocked,
} from '@/features/member/dashboard-tabs';

import { CabinetSignOut } from './CabinetSignOut';
import {
  cabinetLockTagClasses,
  cabinetMobileNavClasses,
  cabinetNavItemActiveClasses,
  cabinetNavItemClasses,
  cabinetNavItemInactiveClasses,
  cabinetNavItemLockedClasses,
  cabinetRootClasses,
  cabinetSidebarClasses,
} from './styles';

type MemberCabinetShellProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  userContext: UserContext;
  activeTab: ImplementedMemberDashboardTab;
  visibleTabs: readonly ImplementedMemberDashboardTab[];
  tabLabels: Record<ImplementedMemberDashboardTab, string>;
  pageTitle: string;
  contactLine: string;
  tabsAriaLabel: string;
  lockLabels: Record<'VIP' | 'BIZ', string>;
  onTabChange: (tab: ImplementedMemberDashboardTab) => void;
  children: React.ReactNode;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getPlanLabel(tier: CurrentMemberProfileDto['membershipTier']): string {
  return tier === 'VIP' ? 'VIP' : 'MEMBER';
}

function renderNavItem({
  tab,
  activeTab,
  tabLabels,
  userContext,
  lockLabels,
  onTabChange,
}: {
  tab: ImplementedMemberDashboardTab;
  activeTab: ImplementedMemberDashboardTab;
  tabLabels: Record<ImplementedMemberDashboardTab, string>;
  userContext: UserContext;
  lockLabels: Record<'VIP' | 'BIZ', string>;
  onTabChange: (tab: ImplementedMemberDashboardTab) => void;
}) {
  const locked = isDashboardTabLocked(userContext, tab);
  const lockLabel = getDashboardTabLockLabel(tab);
  const isActive = activeTab === tab;

  return (
    <button
      key={tab}
      type="button"
      onClick={() => onTabChange(tab)}
      className={cn(
        cabinetNavItemClasses,
        isActive ? cabinetNavItemActiveClasses : cabinetNavItemInactiveClasses,
        locked && !isActive && cabinetNavItemLockedClasses,
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span>{tabLabels[tab]}</span>
      {locked && lockLabel ? (
        <span className={cabinetLockTagClasses}>{lockLabels[lockLabel]}</span>
      ) : null}
    </button>
  );
}

export function MemberCabinetShell({
  locale,
  profile,
  userContext,
  activeTab,
  visibleTabs,
  tabLabels,
  pageTitle,
  contactLine,
  tabsAriaLabel,
  lockLabels,
  onTabChange,
  children,
}: MemberCabinetShellProps) {
  const displayName = profile.displayName ?? profile.phone;
  const planLabel = getPlanLabel(profile.membershipTier);

  return (
    <div className={cabinetRootClasses}>
      <nav aria-label={tabsAriaLabel} className={cabinetMobileNavClasses}>
        {visibleTabs.map((tab) =>
          renderNavItem({ tab, activeTab, tabLabels, userContext, lockLabels, onTabChange }),
        )}
      </nav>

      <aside className={cabinetSidebarClasses}>
        

        <div className="shrink-0 border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-surface-muted text-sm font-bold text-accent"
              aria-hidden="true"
            >
              {getInitials(displayName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
                {planLabel}
              </p>
            </div>
          </div>
        </div>

        <nav aria-label={tabsAriaLabel} className="flex-1 space-y-0 py-2">
          {visibleTabs.map((tab) =>
            renderNavItem({ tab, activeTab, tabLabels, userContext, lockLabels, onTabChange }),
          )}
        </nav>

        <div className="shrink-0 border-t border-border px-6 py-5">
          <CabinetSignOut locale={locale} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-6 sm:px-12">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{pageTitle}</h1>
          <p className="hidden text-sm text-muted sm:block">{contactLine}</p>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
