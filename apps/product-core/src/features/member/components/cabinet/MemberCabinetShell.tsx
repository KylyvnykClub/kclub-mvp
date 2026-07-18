'use client';

import {
  Bell,
  CreditCard,
  Inbox,
  LayoutDashboard,
  LogOut,
  Briefcase,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';

import type { CurrentMemberProfileDto, MemberBusinessProfileDto, UserContext } from '@kclub/contracts';

import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';
import type { ImplementedMemberDashboardTab } from '@/features/member/dashboard-tabs';
import { getDashboardTabLockLabel, isDashboardTabLocked } from '@/features/member/dashboard-tabs';
import { Badge } from '@/components/reui/badge';

import cardLogo from '@/assets/logo/card-logo.png';
import { CabinetSignOut } from './CabinetSignOut';

type MemberCabinetShellProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  business: MemberBusinessProfileDto | null;
  userContext: UserContext;
  activeTab: ImplementedMemberDashboardTab;
  visibleTabs: readonly ImplementedMemberDashboardTab[];
  tabLabels: Record<ImplementedMemberDashboardTab, string>;
  onTabChange: (tab: ImplementedMemberDashboardTab) => void;
  children: React.ReactNode;
};

const TAB_PAGE_TITLES: Record<ImplementedMemberDashboardTab, string> = {
  overview: 'Overview',
  profile: 'Business Profile',
  settings: 'Settings',
  billing: 'Billing',
  notifications: 'Notifications',
  inbox: 'Inbox',
};

const DASHBOARD_TAB_ICONS: Record<ImplementedMemberDashboardTab, LucideIcon> = {
  overview: LayoutDashboard,
  profile: Briefcase,
  settings: Settings,
  billing: CreditCard,
  notifications: Bell,
  inbox: Inbox,
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

export function MemberCabinetShell({
  locale,
  profile,
  business,
  userContext,
  activeTab,
  visibleTabs,
  tabLabels,
  onTabChange,
  children,
}: MemberCabinetShellProps) {
  const displayName = profile.displayName ?? profile.phone;
  const businessName = business?.name ?? displayName;
  const isVerified = business?.status === 'PUBLISHED' || business?.status === 'APPROVED';

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* SIDEBAR */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-border bg-surface lg:flex lg:sticky lg:top-0 lg:h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-5">
          <Image
            src={cardLogo}
            alt=""
            className="h-6 w-6 shrink-0 object-contain"
          />
          <span className="text-xs font-bold tracking-[0.14em] text-accent">
            KYLYVNYK CLUB
          </span>
        </div>

        {/* Business identity */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted font-mono text-xs font-semibold text-muted-foreground">
            {getInitials(businessName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{businessName}</p>
            {isVerified && (
              <Badge variant="success" size="xs" className="mt-1">
                Verified
              </Badge>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
          {visibleTabs.filter((t) => t !== 'settings').map((tab) => {
            const Icon = DASHBOARD_TAB_ICONS[tab];
            const isActive = tab === activeTab;
            const locked = isDashboardTabLocked(userContext, tab);

            return (
              <button
                key={tab}
                type="button"
                onClick={() => !locked && onTabChange(tab)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-surface-muted text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-surface-muted/50 hover:text-foreground',
                  locked && 'cursor-not-allowed opacity-50',
                )}
              >
                <Icon
                  size={17}
                  className={cn(
                    isActive ? 'text-accent' : 'text-muted',
                  )}
                />
                <span className="flex-1">{tabLabels[tab]}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer: Settings + Sign out */}
        <div className="flex items-center gap-4 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={() => onTabChange('settings')}
            className={cn(
              'flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors',
              activeTab === 'settings' && 'text-foreground font-semibold',
            )}
          >
            <Settings size={15} />
            {tabLabels.settings}
          </button>
          <CabinetSignOut locale={locale} />
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface/90 px-7 py-4 backdrop-blur-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Business account
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">
              {tabLabels[activeTab]}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <div className="lg:hidden">
              <select
                value={activeTab}
                onChange={(e) => onTabChange(e.target.value as ImplementedMemberDashboardTab)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                {visibleTabs.map((tab) => (
                  <option key={tab} value={tab}>
                    {tabLabels[tab]}
                  </option>
                ))}
              </select>
            </div>

            {/* Bell */}
            <button
              type="button"
              onClick={() => onTabChange('notifications')}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell size={17} />
            </button>

            {/* User avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-muted text-xs font-semibold text-muted-foreground">
              {getInitials(displayName)}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-7 py-8">
          <div className="mx-auto w-full max-w-[1120px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
