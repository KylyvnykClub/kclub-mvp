import { redirect } from 'next/navigation';

import { requireStaffProfile } from '@/server/auth/profile';
import { fetchAuditLogs } from '@/features/audit/api';
import { fetchCategories } from '@/features/categories/api';
import { SettingsPageClient } from '@/features/settings/components/settings-page-client';

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
  await requireStaffProfile();
  const sp = await searchParams;

  if (sp.section === 'staff') {
    redirect('/dashboard/staff');
  }

  const auditPage = Number(sp.page) || 1;
  const auditLimit = Math.min(Number(sp.limit) || 20, 100);
  const auditFilters = {
    action: sp.action,
    actorRole: sp.actorRole,
    entityType: sp.entityType,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
  };

  const [auditResult, categories] = await Promise.all([
    fetchAuditLogs({ ...auditFilters, page: auditPage, limit: auditLimit }),
    fetchCategories(),
  ]);

  return (
    <SettingsPageClient
      initialSection={sp.section}
      auditLogs={auditResult?.logs ?? []}
      auditTotal={auditResult?.total ?? 0}
      auditPage={auditResult?.page ?? auditPage}
      auditLimit={auditResult?.limit ?? auditLimit}
      auditFilters={auditFilters}
      categories={categories ?? []}
    />
  );
}
