import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { requireStaffProfile } from '@/server/auth/profile';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { DashboardRouteGuard } from '@/components/dashboard/dashboard-route-guard';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await requireStaffProfile();

  if (!profile.totpVerified) {
    redirect('/auth/2fa-required');
  }

  return (
    <SidebarProvider>
      <AppSidebar
        staffRole={profile.role}
        staffName={profile.name}
        staffInitials={profile.initials}
      />
      <SidebarInset>
        <DashboardHeader
          staffName={profile.name}
          staffRole={profile.role}
          staffInitials={profile.initials}
        />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <DashboardRouteGuard staffRole={profile.role}>{children}</DashboardRouteGuard>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
