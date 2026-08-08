import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { getDbClient, schema } from '@/server/db';
import { eq, asc } from 'drizzle-orm';
import { IntroductionSubmitForm } from '@/features/member/components/IntroductionSubmitForm';
import { cabinetContentClasses } from '@/features/member/components/cabinet/styles';

type IntroductionsTabPanelProps = {
  locale: Locale;
};

export async function IntroductionsTabPanel({ locale }: IntroductionsTabPanelProps) {
  const t = await getTranslations({ locale, namespace: 'member.dashboard.introductions' });

  const db = getDbClient();
  const businesses = await db.query.businessProfiles.findMany({
    where: eq(schema.businessProfiles.status, 'PUBLISHED'),
    columns: { id: true, name: true },
    orderBy: [asc(schema.businessProfiles.name)],
  });

  const businessOptions = businesses.map((b) => ({ id: b.id, name: b.name }));

  return (
    <div className={cabinetContentClasses}>
      <div className="mb-12">
        <h1 className="font-semibold text-[28px] text-accent tracking-[0.2em] uppercase mb-4">
          Recommend a Client
        </h1>
        <p className="text-[16px] text-muted-foreground max-w-xl">
          Discreetly introduce a prospective client to our exclusive network. Submissions are reviewed with the utmost confidentiality.
        </p>
      </div>
      <IntroductionSubmitForm businessOptions={businessOptions} />
    </div>
  );
}
