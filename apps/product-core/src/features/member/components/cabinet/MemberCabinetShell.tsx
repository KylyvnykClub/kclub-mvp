'use client';

import type { CurrentMemberProfileDto, UserContext } from '@kclub/contracts';

import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';
import type { ImplementedMemberDashboardTab } from '@/features/member/dashboard-tabs';
import {
  getDashboardTabLockLabel,
  isDashboardTabLocked,
} from '@/features/member/dashboard-tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/reui/badge';

import { CabinetSignOut } from './CabinetSignOut';
import { cabinetMobileNavClasses, cabinetRootClasses, cabinetSidebarClasses } from './styles';

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

function renderTabTriggers({
  visibleTabs,
  tabLabels,
  userContext,
  lockLabels,
  itemClassName,
}: {
  visibleTabs: readonly ImplementedMemberDashboardTab[];
  tabLabels: Record<ImplementedMemberDashboardTab, string>;
  userContext: UserContext;
  lockLabels: Record<'VIP' | 'BIZ', string>;
  itemClassName: string;
}) {
  return visibleTabs.map((tab) => {
    const locked = isDashboardTabLocked(userContext, tab);
    const lockLabel = getDashboardTabLockLabel(tab);

    return (
      <TabsTrigger
        key={tab}
        value={tab}
        className={cn(itemClassName, locked && 'text-muted')}
      >
        <span>{tabLabels[tab]}</span>
        {locked && lockLabel ? (
          <Badge variant="outline" size="xs">
            {lockLabels[lockLabel]}
          </Badge>
        ) : null}
      </TabsTrigger>
    );
  });
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

  const handleValueChange = (value: string) => {
    onTabChange(value as ImplementedMemberDashboardTab);
  };

  return (
    <div className={cabinetRootClasses}>
      {/* Unified header spanning full width */}
      <header className="sticky top-0 z-20 col-span-full flex w-full shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4 sm:px-10 lg:order-first lg:col-span-full">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="border border-accent/30 bg-surface-muted">
            <AvatarFallback className="bg-transparent text-sm font-bold text-accent">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            <Badge
              variant={planLabel === 'VIP' ? 'success-light' : 'outline'}
              size="sm"
              className="mt-1"
            >
              {planLabel}
            </Badge>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{pageTitle}</h1>
        <p className="hidden text-sm text-muted sm:block">{contactLine}</p>
      </header>

      {/* Mobile tabs */}
      <Tabs value={activeTab} onValueChange={handleValueChange} className={cabinetMobileNavClasses}>
        <TabsList
          aria-label={tabsAriaLabel}
          variant="line"
          className="h-auto w-full justify-start gap-0 rounded-none bg-transparent p-0"
        >
          {renderTabTriggers({
            visibleTabs,
            tabLabels,
            userContext,
            lockLabels,
            itemClassName:
              'shrink-0 gap-2 rounded-none px-4 py-3.5 text-sm font-semibold tracking-wide',
          })}
        </TabsList>
      </Tabs>

      {/* Sidebar + content row */}
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className={cabinetSidebarClasses}>
          <Tabs
            value={activeTab}
            onValueChange={handleValueChange}
            orientation="vertical"
            className="flex-1"
          >
            <TabsList
              aria-label={tabsAriaLabel}
              variant="line"
              className="h-fit w-full flex-col items-stretch justify-start gap-0 rounded-none bg-transparent p-0 py-2"
            >
              {renderTabTriggers({
                visibleTabs,
                tabLabels,
                userContext,
                lockLabels,
                itemClassName:
                  'h-auto w-full flex-none grow-0 justify-between rounded-none px-6 py-3.5 text-sm font-semibold tracking-wide',
              })}
            </TabsList>
          </Tabs>

          <div className="shrink-0 border-t border-border px-6 py-5">
            <CabinetSignOut locale={locale} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
