import { PageShell } from '@/components/page-shell';
import { requireStaffProfile } from '@/server/auth/profile';
import { fetchIntroductions } from '@/features/introductions/api';
import { IntroductionsTable } from '@/features/introductions/components/introductions-table';

export default async function IntroductionsPage() {
  const profile = await requireStaffProfile();
  const introductions = await fetchIntroductions();

  return (
    <PageShell
      title="Introductions"
      description="Queue and review area for business introductions."
      roleScope="MODERATOR"
    >
      <IntroductionsTable introductions={introductions ?? []} staffRole={profile.role} />
    </PageShell>
  );
}
