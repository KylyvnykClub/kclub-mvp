import { PageShell } from '@/components/page-shell';
import { requireStaffProfile } from '@/server/auth/profile';
import { fetchUsers } from '@/features/users/api';
import { fetchDashboardMetrics } from '@/features/dashboard/api';
import { UsersTable } from '@/features/users/components/users-table';
import { StatCard } from '@/features/dashboard/components/stat-card';
import { percentDelta } from '@/features/dashboard/format';


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

  const [profile, result, metrics] = await Promise.all([
    requireStaffProfile(),
    fetchUsers({
      page,
      limit,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      membershipTier: tierFilter !== 'all' ? tierFilter : undefined,
    }),
    fetchDashboardMetrics(),
  ]);

  const m = metrics.status === 'success' ? metrics.data : null;

  return (
    <PageShell title="Users" breadcrumbs="Pages / Users / Overview">
      {m && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Users"
            value={m.totalUsers}
            from={m.newUsers7d != null ? m.totalUsers - m.newUsers7d : null}
            delta={
              m.newUsers7d != null
                ? percentDelta(m.totalUsers, m.totalUsers - m.newUsers7d)
                : null
            }
          />
          <StatCard
            label="Active Members"
            value={m.activeUsers}
            detail={`of ${m.totalUsers}`}
          />
          <StatCard
            label="New (7 days)"
            value={m.newUsers7d ?? 0}
          />
          <StatCard
            label="Blocked"
            value={m.blockedUsers}
          />
        </div>
      )}

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
