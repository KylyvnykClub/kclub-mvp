'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import type { StaffAccountTab } from '@/features/account/staff-account-tabs';
import { STAFF_ACCOUNT_TABS } from '@/features/account/staff-account-tabs';
import { StaffAccountShell } from './StaffAccountShell';

type StaffAccountClientProps = {
  staffName: string;
  staffRole: string;
  staffInitials: string;
  initialTab: StaffAccountTab;
  panels: Record<StaffAccountTab, ReactNode>;
};

export function StaffAccountClient({
  staffName,
  staffRole,
  staffInitials,
  initialTab,
  panels,
}: StaffAccountClientProps) {
  const [activeTab, setActiveTab] = useState<StaffAccountTab>(initialTab);

  useEffect(() => {
    history.replaceState(null, '', `/dashboard/account?tab=${activeTab}`);
  }, [activeTab]);

  return (
    <StaffAccountShell
      staffName={staffName}
      staffRole={staffRole}
      staffInitials={staffInitials}
      activeTab={activeTab}
      visibleTabs={STAFF_ACCOUNT_TABS}
      onTabChange={setActiveTab}
    >
      {STAFF_ACCOUNT_TABS.map((tab) => (
        <div key={tab} className={activeTab === tab ? undefined : 'hidden'}>
          {panels[tab]}
        </div>
      ))}
    </StaffAccountShell>
  );
}
