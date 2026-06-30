'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { UnauthorizedView } from '@/components/unauthorized-view';
import { hasRouteAccess, getRequiredRoleLabel } from '@/server/auth/route-permissions';
import type { StaffRole } from '@kclub/contracts';

type DashboardRouteGuardProps = {
  staffRole: StaffRole;
  children: ReactNode;
};

export function DashboardRouteGuard({ staffRole, children }: DashboardRouteGuardProps) {
  const pathname = usePathname();

  if (!hasRouteAccess(staffRole, pathname)) {
    return (
      <UnauthorizedView staffRole={staffRole} requiredRoles={getRequiredRoleLabel(pathname)} />
    );
  }

  return <>{children}</>;
}
