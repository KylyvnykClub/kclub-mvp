'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import type { CurrentMemberProfileDto, UserContext } from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import type { ImplementedMemberDashboardTab } from '@/features/member/dashboard-tabs';
import { MemberCabinetShell } from './cabinet/MemberCabinetShell';

type DashboardTabsClientProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  userContext: UserContext;
  initialTab: ImplementedMemberDashboardTab;
  visibleTabs: readonly ImplementedMemberDashboardTab[];
  tabLabels: Record<ImplementedMemberDashboardTab, string>;
  contactLine: string;
  tabsAriaLabel: string;
  lockLabels: Record<'VIP' | 'BIZ', string>;
  panels: Partial<Record<ImplementedMemberDashboardTab, ReactNode>>;
};

export function DashboardTabsClient({
  locale,
  profile,
  userContext,
  initialTab,
  visibleTabs,
  tabLabels,
  contactLine,
  tabsAriaLabel,
  lockLabels,
  panels,
}: DashboardTabsClientProps) {
  const [activeTab, setActiveTab] = useState<ImplementedMemberDashboardTab>(initialTab);

  useEffect(() => {
    history.replaceState(null, '', `/${locale}/m/dashboard?tab=${activeTab}`);
  }, [activeTab, locale]);

  return (
    <MemberCabinetShell
      locale={locale}
      profile={profile}
      userContext={userContext}
      activeTab={activeTab}
      visibleTabs={visibleTabs}
      tabLabels={tabLabels}
      contactLine={contactLine}
      tabsAriaLabel={tabsAriaLabel}
      lockLabels={lockLabels}
      onTabChange={setActiveTab}
    >
      {visibleTabs.map((tab) => (
        <div key={tab} className={activeTab === tab ? undefined : 'hidden'}>
          {panels[tab]}
        </div>
      ))}
    </MemberCabinetShell>
  );
}
