'use client';

import { LogOut } from 'lucide-react';

import { logoutAction } from '@/server/auth/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StaffAccountTab } from '@/features/account/staff-account-tabs';
import { STAFF_ACCOUNT_TAB_LABELS } from '@/features/account/staff-account-tabs';

import {
  accountRootClasses,
  accountSidebarClasses,
  accountMobileNavClasses,
  accountNavItemClasses,
  accountNavItemActiveClasses,
  accountNavItemInactiveClasses,
} from './styles';

type StaffAccountShellProps = {
  staffName: string;
  staffRole: string;
  staffInitials: string;
  activeTab: StaffAccountTab;
  visibleTabs: readonly StaffAccountTab[];
  onTabChange: (tab: StaffAccountTab) => void;
  children: React.ReactNode;
};

export function StaffAccountShell({
  staffName,
  staffRole,
  staffInitials,
  activeTab,
  visibleTabs,
  onTabChange,
  children,
}: StaffAccountShellProps) {
  return (
    <div className={accountRootClasses}>
      <nav aria-label="Account tabs" className={accountMobileNavClasses}>
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={cn(
              accountNavItemClasses,
              activeTab === tab ? accountNavItemActiveClasses : accountNavItemInactiveClasses,
            )}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            {STAFF_ACCOUNT_TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      <aside className={accountSidebarClasses}>
        <div className="shrink-0 border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback>{staffInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{staffName}</p>
              <Badge variant="secondary" className="mt-0.5">
                {staffRole}
              </Badge>
            </div>
          </div>
        </div>

        <nav aria-label="Account tabs" className="flex-1 space-y-0 py-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={cn(
                accountNavItemClasses,
                activeTab === tab ? accountNavItemActiveClasses : accountNavItemInactiveClasses,
              )}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {STAFF_ACCOUNT_TAB_LABELS[tab]}
            </button>
          ))}
        </nav>

        <div className="shrink-0 border-t px-6 py-4">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => logoutAction()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-14 z-10 flex items-center border-b bg-background px-6 py-4 sm:px-8">
          <h1 className="text-xl font-semibold">{STAFF_ACCOUNT_TAB_LABELS[activeTab]}</h1>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
