import { getDbClient, schema } from '@/server/db';
import { eq, asc } from 'drizzle-orm';
import { IntroductionSubmitForm } from '@/features/member/components/IntroductionSubmitForm';
import { cabinetContentClasses } from '@/features/member/components/cabinet/styles';

export async function IntroductionsTabPanel() {
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
        <h1 className="mb-4 text-[28px] font-semibold uppercase tracking-[0.2em] text-accent">
          Recommend a Client
        </h1>
        <p className="max-w-xl text-[16px] text-muted-foreground">
          Discreetly introduce a prospective client to our exclusive network. Submissions are
          reviewed with the utmost confidentiality.
        </p>
      </div>
      <IntroductionSubmitForm businessOptions={businessOptions} />
    </div>
  );
}
