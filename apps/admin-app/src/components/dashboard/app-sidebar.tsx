'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { dashboardNav } from '@/components/dashboard/navigation';
import { cn } from '@/lib/utils';
import type { StaffRole } from '@kclub/contracts';

type AppSidebarProps = {
  className?: string;
  staffRole: StaffRole;
};

export function AppSidebar({ className, staffRole }: AppSidebarProps) {
  const pathname = usePathname();

  const visibleItems = dashboardNav.filter((item) => item.roles.includes(staffRole));

  return (
    <aside className={cn('bg-card flex min-h-screen w-64 flex-col border-r', className)}>
      <div className="flex h-14 items-center border-b px-4">
        <p className="text-sm font-semibold">KCLUB Admin Dashboard</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex min-h-[44px] w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors',
                active
                  ? ' font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-zinc-950',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
