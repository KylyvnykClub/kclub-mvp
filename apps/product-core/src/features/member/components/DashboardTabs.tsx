import type { ReactNode } from 'react';

import { getTranslations } from 'next-intl/server';

import type {
  CurrentMemberProfileDto,
  MemberBusinessProfileDto,
  UserContext,
} from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import type { ImplementedMemberDashboardTab } from '@/features/member/dashboard-tabs';
import { getOwnBusinesses } from '@/server/services/business-service';
import { getIncomingIntroductions } from '@/server/services/introduction-service';

import { BusinessProfilePanel } from './panels/BusinessProfilePanel';
import { DashboardTabsClient } from './DashboardTabsClient';

type DashboardTabsProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  cardNumber: string | null;
  userContext: UserContext;
  activeTab: ImplementedMemberDashboardTab;
  visibleTabs: readonly ImplementedMemberDashboardTab[];
};

export async function DashboardTabs({
  locale,
  profile,
  cardNumber,
  userContext,
  activeTab,
  visibleTabs,
}: DashboardTabsProps) {
  const t = await getTranslations({ locale, namespace: 'member.dashboard' });

  const tabLabels: Record<ImplementedMemberDashboardTab, string> = {
    overview: t('tabs.overview'),
    profile: t('tabs.profile'),
    settings: t('tabs.settings'),
    billing: t('tabs.billing'),
    notifications: t('tabs.notifications'),
    inbox: t('tabs.inbox'),
  };

  const ownBusinesses = await getOwnBusinesses(profile.id);
  const activeBusiness = ownBusinesses.find((b) => b.status !== 'REJECTED') ?? null;
  const introductionCount = activeBusiness
    ? (await getIncomingIntroductions(activeBusiness.id)).length
    : 0;

  const serverPanels: Partial<Record<ImplementedMemberDashboardTab, ReactNode>> = {};

  if (visibleTabs.includes('profile')) {
    serverPanels.profile = (
      <BusinessProfilePanel locale={locale} profile={profile} />
    );
  }

  return (
    <DashboardTabsClient
      locale={locale}
      profile={profile}
      business={activeBusiness}
      cardNumber={cardNumber}
      introductionCount={introductionCount}
      userContext={userContext}
      initialTab={activeTab}
      visibleTabs={visibleTabs}
      tabLabels={tabLabels}
      serverPanels={serverPanels}
    />
  );
}
