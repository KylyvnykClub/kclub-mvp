import { requireStaffProfile } from '@/server/auth/profile';
import { fetchAuditLogs } from '@/features/audit/api';
import { normalizeAccountTab } from '@/features/account/staff-account-tabs';
import { StaffAccountClient } from '@/features/account/components/StaffAccountClient';
import { DetailsPanel } from '@/features/account/components/panels/DetailsPanel';
import { SecurityPanel } from '@/features/account/components/panels/SecurityPanel';
import { ActivityPanel } from '@/features/account/components/panels/ActivityPanel';
import { PermissionsPanel } from '@/features/account/components/panels/PermissionsPanel';
import { SettingsPanel } from '@/features/account/components/panels/SettingsPanel';
import type { StaffRole } from '@kclub/contracts';

type AccountPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const profile = await requireStaffProfile();
  const sp = await searchParams;
  const initialTab = normalizeAccountTab(sp.tab);

  const activityResult = await fetchAuditLogs({
    actorStaffId: profile.id,
    limit: 50,
  });

  return (
    <StaffAccountClient
      staffName={profile.name}
      staffRole={profile.role}
      staffInitials={profile.initials}
      initialTab={initialTab}
      panels={{
        details: (
          <DetailsPanel
            staffId={profile.id}
            staffName={profile.name}
            staffPhone={profile.phone}
            staffRole={profile.role}
            staffInitials={profile.initials}
          />
        ),
        security: <SecurityPanel totpVerified={profile.totpVerified} />,
        activity: <ActivityPanel logs={activityResult?.logs ?? []} />,
        permissions: <PermissionsPanel staffRole={profile.role as StaffRole} />,
        settings: <SettingsPanel staffRole={profile.role as StaffRole} />,
      }}
    />
  );
}
