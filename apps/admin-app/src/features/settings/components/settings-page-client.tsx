'use client';

import { useState } from 'react';

import type { AuditLogDto } from '@kclub/contracts';

import { PageShell } from '@/components/page-shell';
import { SubTabs, type SubTabItem } from '@/components/sub-tabs';
import { AuditTable } from '@/features/audit/components/audit-table';
import { CategoriesTable } from '@/features/categories/components/categories-table';
import type { AuditLogSearchParams } from '@/features/audit/api';

type SettingsPageClientProps = {
  initialSection?: string;
  auditLogs: AuditLogDto[];
  auditTotal: number;
  auditPage: number;
  auditLimit: number;
  auditFilters: AuditLogSearchParams;
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
}: SettingsPageClientProps) {
  const [activeSection, setActiveSection] = useState(() => normalizeSection(initialSection));

  return (
    <PageShell
      title="Settings"
      description="Audit logs, categories, and platform configuration."
      roleScope="ADMIN"
    >
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
