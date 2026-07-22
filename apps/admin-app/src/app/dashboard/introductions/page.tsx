import { PageShell } from '@/components/page-shell';
import { requireStaffProfile } from '@/server/auth/profile';
import { fetchIntroductions } from '@/features/introductions/api';
import { fetchDashboardMetrics } from '@/features/dashboard/api';
import { StatCard } from '@/features/dashboard/components/stat-card';
import { IntroductionsTable } from '@/features/introductions/components/introductions-table';

export default async function IntroductionsPage() {
  const [profile, result, metrics] = await Promise.all([
    requireStaffProfile(),
    fetchIntroductions(),
    fetchDashboardMetrics(),
  ]);

  const m = metrics.status === 'success' ? metrics.data : null;

  return (
    <PageShell
      title="Introductions"
      description="Queue and review area for business introductions."
      breadcrumbs="Pages / Introductions / Overview"
    >
      {m && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Submitted"
            value={m.introductionsSubmitted}
          />
          <StatCard
            label="In Review"
            value={m.introductionsInReview}
          />
          <StatCard
            label="Total Businesses"
            value={m.totalBusinesses ?? 0}
          />
        </div>
      )}

      <IntroductionsTable introductions={result?.introductions ?? []} staffRole={profile.role} />
    </PageShell>
  );
}
