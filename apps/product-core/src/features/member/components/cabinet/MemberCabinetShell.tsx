'use client';

import { Building2, Gem, Handshake, Inbox, Phone, Settings, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { CurrentMemberProfileDto, UserContext } from '@kclub/contracts';

import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';
import type { ImplementedMemberDashboardTab } from '@/features/member/dashboard-tabs';
import { getDashboardTabLockLabel, isDashboardTabLocked } from '@/features/member/dashboard-tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/reui/badge';

import { CabinetButton } from './CabinetButton';
import { CabinetSignOut } from './CabinetSignOut';
import { cabinetMobileNavClasses, cabinetRootClasses, cabinetSidebarClasses } from './styles';

type MemberCabinetShellProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  userContext: UserContext;
  activeTab: ImplementedMemberDashboardTab;
  visibleTabs: readonly ImplementedMemberDashboardTab[];
  tabLabels: Record<ImplementedMemberDashboardTab, string>;
  contactLine: string;
  tabsAriaLabel: string;
  lockLabels: Record<'VIP' | 'BIZ', string>;
  tabBadges?: Partial<Record<ImplementedMemberDashboardTab, number>>;
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

function getPrimaryTabs(
  visibleTabs: readonly ImplementedMemberDashboardTab[],
): readonly ImplementedMemberDashboardTab[] {
  return visibleTabs.filter((tab) => tab !== 'settings');
}

const DASHBOARD_TAB_ICONS: Partial<Record<ImplementedMemberDashboardTab, LucideIcon>> = {
  details: UserRound,
  business: Building2,
  recommendations: Inbox,
  introductions: Handshake,
};

function renderTabTriggers({
  visibleTabs,
  tabLabels,
  userContext,
  lockLabels,
  tabBadges,
  itemClassName,
}: {
  visibleTabs: readonly ImplementedMemberDashboardTab[];
  tabLabels: Record<ImplementedMemberDashboardTab, string>;
  userContext: UserContext;
  lockLabels: Record<'VIP' | 'BIZ', string>;
  tabBadges?: Partial<Record<ImplementedMemberDashboardTab, number>> | undefined;
  itemClassName: string;
}) {
  return visibleTabs.map((tab) => {
    const locked = isDashboardTabLocked(userContext, tab);
    const lockLabel = getDashboardTabLockLabel(tab);
    const TabIcon = DASHBOARD_TAB_ICONS[tab];
    const badgeCount = tabBadges?.[tab] ?? 0;
    const showVipMarker = tab === 'details' && userContext.isVip;

    return (
      <TabsTrigger
        key={tab}
        value={tab}
        data-testid={`dashboard-tab-${tab}`}
        className={cn('min-w-0', itemClassName, locked && 'text-muted')}
      >
        {TabIcon ? <TabIcon size={16} aria-hidden /> : null}
        <span className="min-w-0 whitespace-normal break-words text-left leading-snug">
          {tabLabels[tab]}
        </span>
        {showVipMarker ? (
          <Gem size={13} strokeWidth={2.3} className="shrink-0 text-accent" aria-label="VIP" />
        ) : null}
        {locked && lockLabel ? (
          <Badge variant="outline" size="xs">
            {lockLabels[lockLabel]}
          </Badge>
        ) : null}
        {!locked && badgeCount > 0 ? (
          <Badge variant="success-light" size="xs">
            {badgeCount}
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
  contactLine,
  tabsAriaLabel,
  lockLabels,
  tabBadges,
  onTabChange,
  children,
}: MemberCabinetShellProps) {
  const displayName = profile.displayName ?? profile.phone;
  const planLabel = getPlanLabel(profile.membershipTier);
  const primaryTabs = getPrimaryTabs(visibleTabs);
  const canShowSettings = visibleTabs.includes('settings');

  const handleValueChange = (value: string) => {
    onTabChange(value as ImplementedMemberDashboardTab);
  };

  const handleSettingsClick = () => {
    onTabChange('settings');
  };

  const settingsAction = canShowSettings ? (
    <CabinetButton
      type="button"
      tone="ghost"
      density="compact"
      onClick={handleSettingsClick}
      className={cn(
        'h-auto gap-1.5 px-0 py-0 tracking-wide text-muted hover:bg-transparent hover:text-foreground',
        activeTab === 'settings' && 'text-foreground',
      )}
      iconStart={<Settings size={14} aria-hidden />}
    >
      {tabLabels.settings}
    </CabinetButton>
  ) : null;

  return (
    <div className={cabinetRootClasses}>
      {/* Unified header spanning full width */}
      <header className="sticky top-0 z-20 col-span-full flex w-full shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4 sm:px-10 lg:order-first lg:col-span-full">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="border-accent/30 border bg-surface-muted">
            <AvatarFallback className="bg-transparent text-sm font-semibold text-accent">
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
        <p className="hidden items-center gap-2 text-sm text-muted sm:flex">
          <Phone size={16} aria-hidden />
          {contactLine}
        </p>
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
            tabBadges,
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
                visibleTabs: primaryTabs,
                tabLabels,
                userContext,
                lockLabels,
                tabBadges,
                itemClassName:
                  'h-auto w-full flex-none grow-0 justify-start gap-2 rounded-none px-6 py-3.5 text-sm font-semibold tracking-wide',
              })}
            </TabsList>
          </Tabs>

          <div className="flex shrink-0 items-center gap-5 border-t border-border px-6 py-5">
            {settingsAction}
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
