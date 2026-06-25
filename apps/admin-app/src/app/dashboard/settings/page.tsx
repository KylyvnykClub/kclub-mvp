import { requireStaffProfile } from '@/server/auth/profile';
import { fetchStaffList } from '@/features/staff/api';
import { fetchAuditLogs } from '@/features/audit/api';
import { fetchCategories } from '@/features/categories/api';
import { SettingsPageClient } from '@/features/settings/components/settings-page-client';
import type { AdminStaffListItemDto } from '@kclub/contracts';

type SettingsPageProps = {
  searchParams: Promise<{
    section?: string;
    page?: string;
    limit?: string;
    action?: string;
    actorRole?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const profile = await requireStaffProfile();
  const sp = await searchParams;

  const auditPage = Number(sp.page) || 1;
  const auditLimit = Math.min(Number(sp.limit) || 20, 100);
  const auditFilters = {
    action: sp.action,
    actorRole: sp.actorRole,
    entityType: sp.entityType,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
  };

  const [fetchedStaff, auditResult, categories] = await Promise.all([
    fetchStaffList(),
    fetchAuditLogs({ ...auditFilters, page: auditPage, limit: auditLimit }),
    fetchCategories(),
  ]);

  const selfEntry: AdminStaffListItemDto = {
    id: profile.id,
    phone: profile.phone,
    displayName: profile.name,
    role: profile.role,
    isActive: true,
    totpVerified: profile.totpVerified,
  };
  const staff = fetchedStaff
    ? fetchedStaff.some((s) => s.id === profile.id)
      ? fetchedStaff
      : [selfEntry, ...fetchedStaff]
    : [selfEntry];

  return (
    <SettingsPageClient
      staffRole={profile.role}
      initialSection={sp.section}
      staff={staff}
      auditLogs={auditResult?.logs ?? []}
      auditTotal={auditResult?.total ?? 0}
      auditPage={auditResult?.page ?? auditPage}
      auditLimit={auditResult?.limit ?? auditLimit}
      auditFilters={auditFilters}
      categories={categories ?? []}
    />
  );
}
