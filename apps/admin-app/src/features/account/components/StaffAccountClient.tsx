'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  STAFF_ACCOUNT_TABS,
  STAFF_ACCOUNT_TAB_LABELS,
  type StaffAccountTab,
} from '@/features/account/staff-account-tabs';

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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="text-base">{staffInitials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{staffName}</h1>
          <Badge variant="secondary" className="mt-0.5">{staffRole}</Badge>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as StaffAccountTab)}
          className="w-full"
        >
          <div className="overflow-x-auto px-6 pt-2">
            <TabsList variant="line" className="min-w-max sm:w-full sm:min-w-0">
              {STAFF_ACCOUNT_TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {STAFF_ACCOUNT_TAB_LABELS[tab]}
                </TabsTrigger>
              ))}
              <TabsIndicator />
            </TabsList>
          </div>
          <div className="border-t">
            {STAFF_ACCOUNT_TABS.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                {panels[tab]}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
