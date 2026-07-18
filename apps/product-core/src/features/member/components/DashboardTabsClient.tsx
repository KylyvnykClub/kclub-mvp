'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import type { CurrentMemberProfileDto, MemberBusinessProfileDto, UserContext } from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import type { ImplementedMemberDashboardTab } from '@/features/member/dashboard-tabs';

import { MemberCabinetShell } from './cabinet/MemberCabinetShell';
import { OverviewPanel } from './panels/OverviewPanel';
import { SettingsPanel } from './SettingsPanel';
import { BillingPanel } from './panels/BillingPanel';
import { NotificationsPanel } from './panels/NotificationsPanel';
import { InboxPanel } from './panels/InboxPanel';

type DashboardTabsClientProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  business: MemberBusinessProfileDto | null;
  cardNumber: string | null;
  introductionCount: number;
  userContext: UserContext;
  initialTab: ImplementedMemberDashboardTab;
  visibleTabs: readonly ImplementedMemberDashboardTab[];
  tabLabels: Record<ImplementedMemberDashboardTab, string>;
  serverPanels: Partial<Record<ImplementedMemberDashboardTab, ReactNode>>;
};

export function DashboardTabsClient({
  locale,
  profile,
  business,
  cardNumber,
  introductionCount,
  userContext,
  initialTab,
  visibleTabs,
  tabLabels,
  serverPanels,
}: DashboardTabsClientProps) {
  const [activeTab, setActiveTab] = useState<ImplementedMemberDashboardTab>(initialTab);

  useEffect(() => {
    history.replaceState(null, '', `/${locale}/m/dashboard?tab=${activeTab}`);
  }, [activeTab, locale]);

  const clientPanels: Partial<Record<ImplementedMemberDashboardTab, ReactNode>> = {
    overview: (
      <OverviewPanel
        locale={locale}
        profile={profile}
        business={business}
        cardNumber={cardNumber}
        introductionCount={introductionCount}
        onNavigate={setActiveTab}
      />
    ),
    settings: <SettingsPanel locale={locale} profile={profile} />,
    billing: <BillingPanel locale={locale} profile={profile} business={business} />,
    notifications: <NotificationsPanel />,
    inbox: <InboxPanel />,
  };

  const panels = { ...clientPanels, ...serverPanels };

  return (
    <MemberCabinetShell
      locale={locale}
      profile={profile}
      business={business}
      userContext={userContext}
      activeTab={activeTab}
      visibleTabs={visibleTabs}
      tabLabels={tabLabels}
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
