import { PageShell } from '@/components/page-shell';
import { requireStaffProfile } from '@/server/auth/profile';
import { fetchCards } from '@/features/cards/api';
import { CardsTable } from '@/features/cards/components/cards-table';

type CardsPageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    membershipTier?: string;
  }>;
};

export default async function CardsPage({ searchParams }: CardsPageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const limit = Math.min(Number(sp.limit) || 20, 100);
  const search = sp.search ?? '';
  const statusFilter = sp.status ?? 'all';
  const tierFilter = sp.membershipTier ?? 'all';

  const profile = await requireStaffProfile();
  const result = await fetchCards({
    page,
    limit,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    membershipTier: tierFilter !== 'all' ? tierFilter : undefined,
  });

  return (
    <PageShell title="Cards" description="Manage club cards — revoke, re-issue." roleScope="ADMIN">
      <CardsTable
        cards={result?.cards ?? []}
        total={result?.total ?? 0}
        page={result?.page ?? page}
        limit={result?.limit ?? limit}
        search={search}
        statusFilter={statusFilter}
        tierFilter={tierFilter}
        staffRole={profile.role}
      />
    </PageShell>
  );
}
