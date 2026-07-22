'use client';

import { useState } from 'react';

import type { AuditLogDto } from '@kclub/contracts';

import { PageShell } from '@/components/page-shell';
import { StatCard } from '@/features/dashboard/components/stat-card';
import { SubTabs, type SubTabItem } from '@/components/sub-tabs';
import { AuditTable } from '@/features/audit/components/audit-table';
import { CategoriesTable } from '@/features/categories/components/categories-table';
import type { AuditLogSearchParams } from '@/features/audit/api';

type SettingsStats = {
  auditTotal: number;
  totalUsers: number;
  totalBusinesses: number;
};

type SettingsPageClientProps = {
  initialSection?: string;
  auditLogs: AuditLogDto[];
  auditTotal: number;
  auditPage: number;
  auditLimit: number;
  auditFilters: AuditLogSearchParams;
  stats?: SettingsStats;
};

const SETTINGS_TABS: SubTabItem[] = [
  { id: 'audit', label: 'Audit' },
  { id: 'categories', label: 'Categories' },
  { id: 'platform', label: 'Platform' },
];

function normalizeSection(section: string | undefined): string {
  if (section && SETTINGS_TABS.some((t) => t.id === section)) return section;
  return 'audit';
}

export function SettingsPageClient({
  initialSection,
  auditLogs,
  auditTotal,
  auditPage,
  auditLimit,
  auditFilters,
  stats,
}: SettingsPageClientProps) {
  const [activeSection, setActiveSection] = useState(() => normalizeSection(initialSection));

  return (
    <PageShell
      title="Settings"
      description="Audit logs, categories, and platform configuration."
      breadcrumbs="Pages / Settings / Overview"
    >
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Audit Events" value={stats.auditTotal} />
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Total Businesses" value={stats.totalBusinesses} />
        </div>
      )}

      <div className="space-y-6">
        <SubTabs tabs={SETTINGS_TABS} activeTab={activeSection} onTabChange={setActiveSection} />
        {activeSection === 'audit' && (
          <AuditTable
            logs={auditLogs}
            total={auditTotal}
            page={auditPage}
            limit={auditLimit}
            filters={auditFilters}
          />
        )}
        {activeSection === 'categories' && <CategoriesTable />}
        {activeSection === 'platform' && (
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-medium">Platform Configuration</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Platform-level settings will be available here.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
