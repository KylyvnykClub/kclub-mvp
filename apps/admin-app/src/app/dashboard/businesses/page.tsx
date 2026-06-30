import { PageShell } from '@/components/page-shell';
import { requireStaffProfile } from '@/server/auth/profile';
import { fetchBusinesses } from '@/features/businesses/api';
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

  const profile = await requireStaffProfile();
  const result = await fetchBusinesses({
    page,
    limit,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  return (
    <PageShell
      title="Businesses"
      description="Moderation queue for verification and publication."
      roleScope="MODERATOR"
      count={result?.total}
    >
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
