'use client';

import { useState } from 'react';

import { PageShell } from '@/components/page-shell';
import { SubTabs, type SubTabItem } from '@/components/sub-tabs';
import { StaffTable } from '@/features/staff/components/staff-table';
import { AuditTable } from '@/features/audit/components/audit-table';
import { CategoriesTable } from '@/features/categories/components/categories-table';
import type { AuditLogSearchParams } from '@/features/audit/api';
import type {
  AdminStaffListItemDto,
  AuditLogDto,
  CategoryDto,
  StaffRole,
} from '@kclub/contracts';

type SettingsPageClientProps = {
  staffRole: StaffRole;
  initialSection?: string;
  staff: AdminStaffListItemDto[];
  auditLogs: AuditLogDto[];
  auditTotal: number;
  auditPage: number;
  auditLimit: number;
  auditFilters: AuditLogSearchParams;
  categories: CategoryDto[];
};

const SETTINGS_TABS: SubTabItem[] = [
  { id: 'staff', label: 'Staff' },
  { id: 'audit', label: 'Audit' },
  { id: 'categories', label: 'Categories' },
  { id: 'platform', label: 'Platform' },
];

function normalizeSection(section: string | undefined): string {
  if (section && SETTINGS_TABS.some((t) => t.id === section)) return section;
  return 'staff';
}

export function SettingsPageClient({
  staffRole,
  initialSection,
  staff,
  auditLogs,
  auditTotal,
  auditPage,
  auditLimit,
  auditFilters,
  categories,
}: SettingsPageClientProps) {
  const [activeSection, setActiveSection] = useState(() => normalizeSection(initialSection));

  return (
    <PageShell title="Settings" description="Staff, audit logs, categories, and platform configuration." roleScope="ADMIN">
      <div className="space-y-6">
        <SubTabs tabs={SETTINGS_TABS} activeTab={activeSection} onTabChange={setActiveSection} />
        {activeSection === 'staff' && <StaffTable staff={staff} />}
        {activeSection === 'audit' && (
          <AuditTable
            logs={auditLogs}
            total={auditTotal}
            page={auditPage}
            limit={auditLimit}
            filters={auditFilters}
          />
        )}
        {activeSection === 'categories' && <CategoriesTable categories={categories} />}
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
