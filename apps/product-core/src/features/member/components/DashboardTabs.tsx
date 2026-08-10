import type { ReactNode } from 'react';

import { and, eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';

import type {
  CountryDto,
  CurrentMemberProfileDto,
  PublicBusinessListItemDto,
  UserContext,
} from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import type { ImplementedMemberDashboardTab } from '@/features/member/dashboard-tabs';
import { isDashboardTabLocked } from '@/features/member/dashboard-tabs';
import { CabinetLockedPanel } from '@/features/member/components/cabinet/CabinetLockedPanel';
import { cabinetContentClasses } from '@/features/member/components/cabinet/styles';
import { getCachedCountries } from '@/server/cache/taxonomy-cache';
import { getDbClient, schema } from '@/server/db';

import { AccountPanel } from './AccountPanel';
import { BusinessPanel } from './BusinessPanel';
import { DashboardTabsClient } from './DashboardTabsClient';
import { IntroductionsPanel } from './IntroductionsPanel';
import { RecommendationsPanel } from './RecommendationsPanel';
import { SettingsPanel } from './SettingsPanel';

type DashboardTabsProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  cardNumber: string | null;
  userContext: UserContext;
  activeTab: ImplementedMemberDashboardTab;
  visibleTabs: readonly ImplementedMemberDashboardTab[];
  serverPublicBusinesses: PublicBusinessListItemDto[];
  pendingIntroductionsCount: number;
};

export async function DashboardTabs({
  locale,
  profile,
  cardNumber,
  userContext,
  activeTab,
  visibleTabs,
  serverPublicBusinesses,
  pendingIntroductionsCount,
}: DashboardTabsProps) {
  const t = await getTranslations({ locale, namespace: 'member.dashboard' });
  const countries = await getCachedCountries();
  const db = getDbClient();
  const activePlacement = await db.query.subscriptions.findFirst({
    where: and(
      eq(schema.subscriptions.user_id, profile.id),
      eq(schema.subscriptions.kind, 'BUSINESS_PLACEMENT'),
      eq(schema.subscriptions.status, 'ACTIVE'),
    ),
    columns: { id: true },
  });
  const countryOptions: Pick<CountryDto, 'id' | 'name'>[] = countries
    .filter((country) => country.isActive)
    .map((country) => ({ id: country.id, name: country.name }));

  const tabLabels: Record<ImplementedMemberDashboardTab, string> = {
    details: t('tabs.details'),
    business: t('tabs.business'),
    recommendations: t('tabs.recommendations'),
    introductions: t('tabs.introductions'),
    settings: t('tabs.settings'),
  };

  const lockLabels = {
    VIP: t('locks.vip'),
    BIZ: t('locks.biz'),
  } as const;

  const panels: Partial<Record<ImplementedMemberDashboardTab, ReactNode>> = {};

  for (const tab of visibleTabs) {
    if (tab === 'details') {
      panels.details = (
        <AccountPanel
          locale={locale}
          profile={profile}
          cardNumber={cardNumber}
          hasActiveBusinessPlacement={Boolean(activePlacement)}
        />
      );
    } else if (tab === 'introductions') {
      panels.introductions = isDashboardTabLocked(userContext, 'introductions') ? (
        <div className={cabinetContentClasses}>
          <CabinetLockedPanel
            locale={locale}
            eyebrow={t('introductionsLocked.eyebrow')}
            title={t('introductionsLocked.title')}
            description={t('introductionsLocked.description')}
            ctaLabel={t('introductionsLocked.cta')}
          />
        </div>
      ) : (
        <IntroductionsPanel
          locale={locale}
          profile={profile}
          serverPublicBusinesses={serverPublicBusinesses}
        />
      );
    } else if (tab === 'business') {
      panels.business = isDashboardTabLocked(userContext, 'business') ? (
        <div className={cabinetContentClasses}>
          <CabinetLockedPanel
            locale={locale}
            eyebrow={t('businessLocked.eyebrow')}
            title={t('businessLocked.title')}
            description={t('businessLocked.description')}
            ctaLabel={t('businessLocked.cta')}
          />
        </div>
      ) : (
        <BusinessPanel locale={locale} profile={profile} />
      );
    } else if (tab === 'recommendations') {
      panels.recommendations = (
        <RecommendationsPanel
          locale={locale}
          profile={profile}
          serverPublicBusinesses={serverPublicBusinesses}
        />
      );
    } else if (tab === 'settings') {
      panels.settings = (
        <SettingsPanel countryOptions={countryOptions} locale={locale} profile={profile} />
      );
    }
  }

  return (
    <DashboardTabsClient
      locale={locale}
      profile={profile}
      userContext={userContext}
      initialTab={activeTab}
      visibleTabs={visibleTabs}
      tabLabels={tabLabels}
      contactLine={profile.phone}
      tabsAriaLabel={t('tabsLabel')}
      lockLabels={lockLabels}
      panels={panels}
      pendingIntroductionsCount={pendingIntroductionsCount}
      introductionsNotice={{
        title: t('introductionsNotice.title'),
        description: t('introductionsNotice.description', { count: pendingIntroductionsCount }),
        cta: t('introductionsNotice.cta'),
      }}
    />
  );
}
