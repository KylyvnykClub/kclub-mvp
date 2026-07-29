import { notFound } from 'next/navigation';

import { PageShell } from '@/components/page-shell';
import { requireStaffProfile } from '@/server/auth/profile';
import { fetchIntroductionDetail } from '@/features/introductions/api';
import { IntroductionDetailClient } from '@/features/introductions/components/introduction-detail-client';

type IntroductionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function IntroductionDetailPage({ params }: IntroductionDetailPageProps) {
  const { id } = await params;
  const [profile, introduction] = await Promise.all([
    requireStaffProfile(),
    fetchIntroductionDetail(id),
  ]);

  if (!introduction) {
    notFound();
  }

  return (
    <PageShell
      title="Introduction"
      description="Full details of a business introduction."
      breadcrumbs="Pages / Introductions / Detail"
    >
      <IntroductionDetailClient introduction={introduction} staffRole={profile.role} />
    </PageShell>
  );
}
