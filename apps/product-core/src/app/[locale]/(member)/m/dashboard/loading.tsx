import { Skeleton } from '@kclub/ui';

import {
  cabinetRootClasses,
  cabinetMobileNavClasses,
  cabinetSidebarClasses,
} from '@/features/member/components/cabinet/styles';

export default function DashboardLoading() {
  return (
    <div className={cabinetRootClasses}>
      {/* Header Skeleton */}
      <header className="sticky top-0 z-20 col-span-full flex w-full shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4 sm:px-10 lg:order-first lg:col-span-full">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="hidden h-5 w-32 sm:block" />
      </header>

      {/* Mobile Tabs Skeleton */}
      <div className={cabinetMobileNavClasses}>
        <div className="flex h-auto w-full justify-start gap-0 p-0">
          {['w-20', 'w-24', 'w-28', 'w-20', 'w-24'].map((widthClass, index) => (
            <div key={`mobile-tab-${index}`} className="shrink-0 px-4 py-3.5">
              <Skeleton className={`h-5 ${widthClass}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar + Content Row */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Sidebar Skeleton */}
        <aside className={cabinetSidebarClasses}>
          <div className="flex-1 py-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={`desktop-tab-${item}`} className="flex items-center gap-2 px-6 py-3.5">
                <Skeleton className="h-4 w-4 shrink-0" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-5 border-t border-border px-6 py-5">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
        </aside>

        {/* Content Skeleton */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col">
            <div className="flex-1 px-6 py-10 sm:px-12">
              <div className="space-y-6">
                <Skeleton className="h-24 w-full max-w-3xl" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
