import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  Building2,
  CreditCard,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  UserCog,
} from 'lucide-react';

import type { StaffRole } from '@kclub/contracts';

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: StaffRole[];
};

export const dashboardNav: DashboardNavItem[] = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['OWNER', 'ADMIN', 'MODERATOR'],
  },
  { title: 'Users', href: '/dashboard/users', icon: Users, roles: ['OWNER', 'ADMIN'] },
  { title: 'Cards', href: '/dashboard/cards', icon: BadgeCheck, roles: ['OWNER', 'ADMIN'] },
  {
    title: 'Businesses',
    href: '/dashboard/businesses',
    icon: Building2,
    roles: ['OWNER', 'ADMIN', 'MODERATOR'],
  },
  {
    title: 'Introductions',
    href: '/dashboard/introductions',
    icon: Sparkles,
    roles: ['OWNER', 'ADMIN', 'MODERATOR'],
  },
  { title: 'Billing', href: '/dashboard/billing', icon: CreditCard, roles: ['OWNER', 'ADMIN'] },
  { title: 'Staff', href: '/dashboard/staff', icon: UserCog, roles: ['OWNER'] },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['OWNER', 'ADMIN'] },
];
