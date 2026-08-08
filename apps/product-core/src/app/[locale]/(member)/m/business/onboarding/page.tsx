import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { requireCurrentMember } from '@/server/member-page';
import { getOwnBusinesses } from '@/server/services/business-service';
import { getDbClient, schema } from '@/server/db';
import { and, asc, eq } from 'drizzle-orm';
import type {
  CategoryTaxonomyOption,
  TaxonomyOption,
} from '@/features/member/components/BusinessPanel';
import { BusinessSubmitWizard } from '@/features/member/components/BusinessSubmitWizard';
import { Breadcrumbs } from '@/features/member/components/Breadcrumbs';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'member.businessOnboarding' });

  return {
    title: t('metaTitle'),
  };
}

export default async function BusinessOnboardingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const profile = await requireCurrentMember(locale);
  const ownBusinesses = await getOwnBusinesses(profile.id);

  if (ownBusinesses.some((business) => business.status !== 'REJECTED')) {
    redirect(`/${locale}/m/dashboard?tab=business`);
  }

  const db = getDbClient();
  const [countries, categories] = await Promise.all([
    db.query.countries.findMany({
      where: eq(schema.countries.is_active, true),
      orderBy: [asc(schema.countries.name)],
    }),
    db.query.categories.findMany({
      where: and(eq(schema.categories.is_active, true), eq(schema.categories.is_high_risk, false)),
      orderBy: [asc(schema.categories.name)],
    }),
  ]);

  const t = await getTranslations({ locale, namespace: 'member.businessOnboarding' });
  const tHub = await getTranslations({ locale, namespace: 'member.dashboard' });

  const countryOptions: TaxonomyOption[] = countries.map((c) => ({ id: c.id, name: c.name }));
  const categoryOptions: CategoryTaxonomyOption[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parent_id ?? null,
    level: c.level as CategoryTaxonomyOption['level'],
  }));

  return (
    <div className="flex flex-grow flex-col items-center justify-center py-10 md:py-20">
      <div className="w-full max-w-2xl mb-6">
        <Breadcrumbs
          homeHref={`/${locale}/m/dashboard`}
          items={[
            { label: tHub('breadcrumbs.business'), href: `/${locale}/m/dashboard?tab=business` },
            { label: t('breadcrumb') },
          ]}
        />
      </div>
      <div className="w-full max-w-2xl border border-border bg-surface p-8 shadow-2xl md:p-16">
        <BusinessSubmitWizard
          locale={locale}
          countryOptions={countryOptions}
          categoryOptions={categoryOptions}
          memberPhone={profile.phone}
        />
      </div>
    </div>
  );
}
