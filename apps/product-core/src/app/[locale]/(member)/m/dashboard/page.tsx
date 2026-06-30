import { getTranslations } from 'next-intl/server';

import type { UserContext } from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import { requireCurrentMember } from '@/server/member-page';
import { getOwnBusinesses, getPublicBusinesses } from '@/server/services/business-service';
import { getActiveCardForUser } from '@/server/services/card-service';
import { DashboardTabs } from '@/features/member/components/DashboardTabs';
import {
  getImplementedDashboardTabs,
  normalizeDashboardTab,
} from '@/features/member/dashboard-tabs';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'member.dashboard' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { locale } = await params;
  const query = await searchParams;

  const profile = await requireCurrentMember(locale);
  const [ownBusinesses, publicBusinesses, activeCardRecord] = await Promise.all([
    getOwnBusinesses(profile.id),
    getPublicBusinesses(),
    getActiveCardForUser(profile.id),
  ]);

  const userContext: UserContext = {
    isVip: profile.membershipTier === 'VIP',
    hasBusiness: ownBusinesses.some((b) => b.status !== 'REJECTED'),
    businessPublished: ownBusinesses.some((b) => b.status === 'PUBLISHED'),
  };

  const visibleTabs = getImplementedDashboardTabs(userContext);
  const activeTab = normalizeDashboardTab(query.tab, visibleTabs);

  return (
    <DashboardTabs
      locale={locale}
      profile={profile}
      cardNumber={activeCardRecord?.card_number ?? null}
      userContext={userContext}
      activeTab={activeTab}
      visibleTabs={visibleTabs}
      serverPublicBusinesses={publicBusinesses}
    />
  );
}
