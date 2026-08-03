'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import type { CurrentMemberProfileDto, UserContext } from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import type { ImplementedMemberDashboardTab } from '@/features/member/dashboard-tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { CabinetButton } from './cabinet/CabinetButton';
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
  pendingIntroductionsCount: number;
  introductionsNotice: { title: string; description: string; cta: string };
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
  pendingIntroductionsCount,
  introductionsNotice,
}: DashboardTabsClientProps) {
  const [activeTab, setActiveTab] = useState<ImplementedMemberDashboardTab>(initialTab);

  useEffect(() => {
    history.replaceState(null, '', `/${locale}/m/dashboard?tab=${activeTab}`);
  }, [activeTab, locale]);

  const showIntroductionsNotice =
    pendingIntroductionsCount > 0 &&
    visibleTabs.includes('recommendations') &&
    activeTab !== 'recommendations';

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
      tabBadges={{ recommendations: pendingIntroductionsCount }}
      onTabChange={setActiveTab}
    >
      {showIntroductionsNotice && (
        <div className="px-6 pt-6 sm:px-10">
          <Alert variant="info">
            <AlertTitle>{introductionsNotice.title}</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{introductionsNotice.description}</span>
              <CabinetButton
                type="button"
                tone="link"
                density="compact"
                onClick={() => setActiveTab('recommendations')}
                className="h-auto px-0 py-0 text-xs text-accent underline hover:bg-transparent hover:text-accent-hover"
              >
                {introductionsNotice.cta}
              </CabinetButton>
            </AlertDescription>
          </Alert>
        </div>
      )}
      {visibleTabs.map((tab) => (
        <div key={tab} className={activeTab === tab ? undefined : 'hidden'}>
          {panels[tab]}
        </div>
      ))}
    </MemberCabinetShell>
  );
}
