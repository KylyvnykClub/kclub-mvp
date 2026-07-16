import type { AdminStaffListItemDto } from '@kclub/contracts';

import { PageShell } from '@/components/page-shell';
import { StaffTable } from '@/features/staff/components/staff-table';
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

  return (
    <PageShell
      title="Staff"
      description="Approve staff phones, assign roles, and control admin dashboard access."
      roleScope="OWNER"
      count={staff.length}
    >
      <StaffTable staff={staff} staffRole={profile.role} />
    </PageShell>
  );
}
