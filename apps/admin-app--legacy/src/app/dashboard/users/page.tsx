import { PageShell } from '@/components/page-shell';
import { requireStaffProfile } from '@/server/auth/profile';
import { fetchUsers } from '@/features/users/api';
import { UsersTable } from '@/features/users/components/users-table';

type UsersPageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    membershipTier?: string;
  }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const limit = Math.min(Number(sp.limit) || 20, 100);
  const search = sp.search ?? '';
  const statusFilter = sp.status ?? 'all';
  const tierFilter = sp.membershipTier ?? 'all';

  const profile = await requireStaffProfile();
  const result = await fetchUsers({
    page,
    limit,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    membershipTier: tierFilter !== 'all' ? tierFilter : undefined,
  });

  return (
    <PageShell
      title="Users"
      description="Admin list of members, statuses, and support actions."
      roleScope="ADMIN"
      count={result?.total}
    >
      <UsersTable
        users={result?.users ?? []}
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
