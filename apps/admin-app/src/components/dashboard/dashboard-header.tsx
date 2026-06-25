'use client';

import Link from 'next/link';
import { LogOut, Menu, User } from 'lucide-react';

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

type DashboardHeaderProps = {
  staffName: string;
  staffRole: StaffRole;
  staffInitials: string;
};

export function DashboardHeader({ staffName, staffRole, staffInitials }: DashboardHeaderProps) {
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
              <Link
                href="/dashboard/account"
                className="relative flex cursor-default select-none items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              >
                <User className="h-4 w-4" />
                My Account
              </Link>
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
