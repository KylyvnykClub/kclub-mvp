import type { AdminStaffListItemDto } from '@kclub/contracts';

import { PageShell } from '@/components/page-shell';
import { StaffTable } from '@/features/staff/components/staff-table';
import { StatCard } from '@/features/dashboard/components/stat-card';
import { fetchStaffList } from '@/features/staff/api';
import { requireStaffProfile } from '@/server/auth/profile';

export default async function StaffPage() {
  const profile = await requireStaffProfile();
  const fetchedStaff = await fetchStaffList();
  const selfEntry: AdminStaffListItemDto = {
    id: profile.id,
    phone: profile.phone,
    displayName: profile.name,
    role: profile.role,
    isActive: true,
    passwordStatus: 'SET',
    permissionOverrides: profile.permissionOverrides,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const staff = fetchedStaff
    ? fetchedStaff.some((entry) => entry.id === profile.id)
      ? fetchedStaff
      : [selfEntry, ...fetchedStaff]
    : [selfEntry];

  const activeStaff = staff.filter((s) => s.isActive).length;

  return (
    <PageShell
      title="Staff"
      description="Approve staff phones, assign roles, and control admin dashboard access."
      breadcrumbs="Pages / Staff / Overview"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Staff"
          value={staff.length}
        />
        <StatCard
          label="Active"
          value={activeStaff}
          detail={`of ${staff.length}`}
        />
        <StatCard
          label="Owners"
          value={staff.filter((s) => s.role === 'OWNER').length}
        />
      </div>

      <StaffTable staff={staff} staffRole={profile.role} />
    </PageShell>
  );
}
