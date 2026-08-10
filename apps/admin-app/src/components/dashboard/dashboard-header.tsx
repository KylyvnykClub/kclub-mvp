'use client';

import { Bell, LogOut, Menu, User } from 'lucide-react';

import Link from 'next/link';
import { logoutAction } from '@/server/auth/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import type { StaffRole } from '@kclub/contracts';
import type { DashboardActivityItemDto } from '@kclub/contracts';

type DashboardHeaderProps = {
  staffName: string;
  staffRole: StaffRole;
  staffInitials: string;
  notifications: DashboardActivityItemDto[];
};

const notificationHrefByType: Record<DashboardActivityItemDto['type'], string> = {
  USER_REGISTERED: '/dashboard/users',
  BUSINESS_SUBMITTED: '/dashboard/businesses?status=UNDER_REVIEW',
  INTRODUCTION_SUBMITTED: '/dashboard/introductions',
};

function formatNotificationTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DashboardHeader({
  staffName,
  staffRole,
  staffInitials,
  notifications,
}: DashboardHeaderProps) {
  return (
    <header className="bg-background/95 sticky top-0 z-20 border-b backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              />
            }
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open navigation</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <AppSidebar className="w-full border-r-0" staffRole={staffRole} />
          </SheetContent>
        </Sheet>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label={`Notifications${notifications.length ? ` (${notifications.length})` : ''}`}
                />
              }
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {notifications.length > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                  {notifications.length}
                </span>
              ) : null}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 py-2 text-sm text-foreground">
                  Notifications
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No recent notifications.
                  </p>
                ) : (
                  notifications.map((notification, index) => (
                    <DropdownMenuItem
                      key={`${notification.type}-${notification.timestamp}-${index}`}
                      render={<Link href={notificationHrefByType[notification.type]} />}
                      className="items-start gap-3 px-3 py-2.5"
                    >
                      <Bell
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-foreground">
                          {notification.title}
                        </span>
                        <span className="block pt-0.5 text-xs text-muted-foreground">
                          {formatNotificationTime(notification.timestamp)}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
            {staffRole}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Staff menu"
                />
              }
            >
              <Avatar size="sm">
                <AvatarFallback>{staffInitials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{staffName}</span>
                    <span className="text-xs font-normal text-muted-foreground">{staffRole}</span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/dashboard/account" />}>
                <User className="h-4 w-4" />
                My Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logoutAction()}>
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
