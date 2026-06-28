import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { getDbClient, schema } from '@/server/db';
import { and, asc, eq } from 'drizzle-orm';
import { BusinessSubmitWizard } from '@/features/member/components/BusinessSubmitWizard';
import type { CityTaxonomyOption, TaxonomyOption } from '@/features/member/components/BusinessPanel';
import { cabinetContentClasses } from '@/features/member/components/cabinet/styles';

type IntroductionsTabPanelProps = {
  locale: Locale;
};

export async function IntroductionsTabPanel({ locale }: IntroductionsTabPanelProps) {
  const t = await getTranslations({ locale, namespace: 'member.dashboard.introductions' });
  const tWizard = await getTranslations({ locale, namespace: 'member.businessOnboarding' });

  const db = getDbClient();
  const [countries, categories, cities] = await Promise.all([
    db.query.countries.findMany({
      where: eq(schema.countries.is_active, true),
      orderBy: [asc(schema.countries.name)],
    }),
    db.query.categories.findMany({
      where: and(
        eq(schema.categories.is_active, true),
        eq(schema.categories.is_high_risk, false)
      ),
      orderBy: [asc(schema.categories.name)],
    }),
    db.query.cities.findMany({
      where: eq(schema.cities.is_active, true),
      orderBy: [asc(schema.cities.name)],
    }),
  ]);

  const countryOptions: TaxonomyOption[] = countries.map((c) => ({ id: c.id, name: c.name }));
  const cityOptions: CityTaxonomyOption[] = cities.map((c) => ({
    id: c.id,
    name: c.name,
    countryId: c.country_id,
  }));
  const categoryOptions: TaxonomyOption[] = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className={cabinetContentClasses}>
      <p className="mb-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {t('wizardDescription')}
      </p>
      <h2 className="mb-9 text-lg font-semibold text-foreground">{tWizard('title')}</h2>
      <BusinessSubmitWizard
        locale={locale}
        countryOptions={countryOptions}
        cityOptions={cityOptions}
        categoryOptions={categoryOptions}
      />
    </div>
  );
}
