import { PageShell } from '@/components/page-shell';
import { requireStaffProfile } from '@/server/auth/profile';
import { fetchBusinesses } from '@/features/businesses/api';
import { fetchDashboardMetrics } from '@/features/dashboard/api';
import { StatCard } from '@/features/dashboard/components/stat-card';
import { BusinessesTable } from '@/features/businesses/components/businesses-table';

type BusinessesPageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function BusinessesPage({ searchParams }: BusinessesPageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const limit = Math.min(Number(sp.limit) || 20, 100);
  const statusFilter = sp.status ?? 'all';

  const [profile, result, metrics] = await Promise.all([
    requireStaffProfile(),
    fetchBusinesses({
      page,
      limit,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    fetchDashboardMetrics(),
  ]);

  const m = metrics.status === 'success' ? metrics.data : null;

  return (
    <PageShell
      title="Businesses"
      description="Moderation queue for verification and publication."
      breadcrumbs="Pages / Businesses / Overview"
    >
      {m && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Total Businesses"
            value={m.totalBusinesses ?? 0}
          />
          <StatCard
            label="Published"
            value={m.publishedBusinesses ?? 0}
            detail={m.totalBusinesses ? `of ${m.totalBusinesses}` : undefined}
          />
          <StatCard
            label="Under Review"
            value={m.businessesUnderReview}
          />
        </div>
      )}

      <BusinessesTable
        businesses={result?.businesses ?? []}
        total={result?.total ?? 0}
        page={result?.page ?? page}
        limit={result?.limit ?? limit}
        statusFilter={statusFilter}
        staffRole={profile.role}
      />
    </PageShell>
  );
}
