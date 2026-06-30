import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { requireStaffProfile } from '@/server/auth/profile';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardRouteGuard } from '@/components/dashboard/dashboard-route-guard';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await requireStaffProfile();

  if (!profile.totpVerified) {
    redirect('/auth/2fa-required');
  }

  return (
    <div className="bg-muted/20 flex min-h-screen">
      <AppSidebar className="hidden lg:flex" staffRole={profile.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          staffName={profile.name}
          staffRole={profile.role}
          staffInitials={profile.initials}
        />
        <main id="content" className="flex-1 p-4 md:p-6">
          <DashboardRouteGuard staffRole={profile.role}>{children}</DashboardRouteGuard>
        </main>
      </div>
    </div>
  );
}
