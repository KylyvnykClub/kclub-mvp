import * as React from 'react';
import { cn } from '@/lib/utils';

export function AdminList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('space-y-4', className)}>{children}</div>;
}

export function AdminListFilters({
  className,
  children,
  as: Component = 'div',
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLDivElement | HTMLFormElement>) {
  return (
    <Component className={cn('flex flex-wrap items-end gap-2', className)} {...props}>
      {children}
    </Component>
  );
}

export function AdminTableCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('rounded-md border', className)}>{children}</div>;
}

export function AdminTableDesktop({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('hidden md:block', className)}>{children}</div>;
}

export function AdminTableMobile({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('divide-y md:hidden', className)}>{children}</div>;
}
