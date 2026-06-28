import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { requireCurrentMember } from '@/server/member-page';
import { getOwnBusinesses } from '@/server/services/business-service';
import { getDbClient, schema } from '@/server/db';
import { eq, and } from 'drizzle-orm';
import { Breadcrumbs } from '@/features/member/components/Breadcrumbs';
import type { CityTaxonomyOption, TaxonomyOption } from '@/features/member/components/BusinessPanel';
import { BusinessSubmitWizard } from '@/features/member/components/BusinessSubmitWizard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
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
  const [countries, categories, cities] = await Promise.all([
    db.query.countries.findMany({
      where: eq(schema.countries.isActive, true),
      orderBy: (c, { asc }) => [asc(c.name)],
    }),
    db.query.categories.findMany({
      where: and(eq(schema.categories.isActive, true), eq(schema.categories.isHighRisk, false)),
      orderBy: (c, { asc }) => [asc(c.name)],
    }),
    db.query.cities.findMany({
      where: eq(schema.cities.isActive, true),
      orderBy: (c, { asc }) => [asc(c.name)],
    }),
  ]);

  const t = await getTranslations({ locale, namespace: 'member.businessOnboarding' });
  const tDash = await getTranslations({ locale, namespace: 'member.dashboard' });

  const breadcrumbItems = [
    { label: tDash('breadcrumbs.dashboard'), href: `/${locale}/m/dashboard` },
    { label: tDash('breadcrumbs.business'), href: `/${locale}/m/dashboard?tab=business` },
    { label: t('breadcrumb') },
  ];
  const homeHref = `/${locale}`;

  const countryOptions: TaxonomyOption[] = countries.map((c) => ({ id: c.id, name: c.name }));
  const cityOptions: CityTaxonomyOption[] = cities.map((c) => ({
    id: c.id,
    name: c.name,
    countryId: c.countryId,
  }));
  const categoryOptions: TaxonomyOption[] = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-8">
      <Breadcrumbs homeHref={homeHref} items={breadcrumbItems} />

      <div>
        <p className="kclub-section-label">{tDash('eyebrow')}</p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white sm:text-4xl">
          {t('title')}
        </h1>
      </div>

      <div className="kclub-panel max-w-none rounded-none px-6 py-6 shadow-none ring-0 dark:bg-zinc-900/50">
        <BusinessSubmitWizard
          locale={locale}
          countryOptions={countryOptions}
          cityOptions={cityOptions}
          categoryOptions={categoryOptions}
        />
      </div>
    </div>
  );
}
