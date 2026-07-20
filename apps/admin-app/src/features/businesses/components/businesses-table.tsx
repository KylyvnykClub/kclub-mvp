'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminPagination } from '@/components/admin-pagination';
import {
  AdminList,
  AdminListFilters,
  AdminTableCard,
  AdminTableDesktop,
  AdminTableMobile,
} from '@/components/admin-list-layout';
import type { AdminBusinessListItemDto, StaffRole } from '@kclub/contracts';

const BUSINESS_STATUSES = ['UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'HIDDEN'] as const;

async function updateFeatured(
  businessId: string,
  payload: { featuredTop?: boolean; featuredRecommended?: boolean },
) {
  const res = await fetch(`/api/proxy/businesses/${businessId}/featured`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    const code = body?.error?.code ?? '';
    const message = body?.error?.message ?? 'Conflict';
    return { ok: false, error: code || message };
  }

  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
}

type BusinessesTableProps = {
  businesses: AdminBusinessListItemDto[];
  total: number;
  page: number;
  limit: number;
  statusFilter: string;
  staffRole: StaffRole;
};

export function BusinessesTable({
  businesses: initialBusinesses,
  total,
  page,
  limit,
  statusFilter: initialStatus,
  staffRole,
}: BusinessesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const canToggle = staffRole === 'OWNER' || staffRole === 'ADMIN' || staffRole === 'MODERATOR';

  async function handleToggle(
    businessId: string,
    field: 'featuredTop' | 'featuredRecommended',
    currentValue: boolean,
  ) {
    if (!canToggle) return;
    const newValue = !currentValue;
    const payload =
      field === 'featuredTop' ? { featuredTop: newValue } : { featuredRecommended: newValue };

    setLoadingId(businessId);
    const result = await updateFeatured(businessId, payload);
    setLoadingId(null);

    if (!result.ok) {
      if (result.error === 'FEATURED_LIMIT_REACHED') {
        toast.error(
          `Maximum ${field === 'featuredTop' ? 'top' : 'recommended'} (3) already reached.`,
        );
      } else if (result.error === 'FEATURED_BUSINESS_NOT_PUBLISHED') {
        toast.error('Only PUBLISHED businesses can be featured.');
      } else {
        toast.error(result.error ?? 'Failed to update');
      }
      return;
    }

    setBusinesses((prev) =>
      prev.map((b) => (b.id === businessId ? { ...b, [field]: newValue } : b)),
    );
    toast.success(
      field === 'featuredTop'
        ? `Top ${newValue ? 'enabled' : 'disabled'}`
        : `Recommended ${newValue ? 'enabled' : 'disabled'}`,
    );
  }

  function buildUrl(overrides: { page?: number; status?: string }) {
    const params = new URLSearchParams();
    const p = overrides.page ?? 1;
    const st = overrides.status ?? statusFilter;
    if (p > 1) params.set('page', String(p));
    if (limit !== 20) params.set('limit', String(limit));
    if (st && st !== 'all') params.set('status', st);
    return `/dashboard/businesses${params.toString() ? '?' + params.toString() : ''}`;
  }

  function navigate(toPage: number) {
    startTransition(() => router.push(buildUrl({ page: toPage })));
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    startTransition(() => router.push(buildUrl({ status: value, page: 1 })));
  }

  return (
    <AdminList>
      <AdminListFilters>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {BUSINESS_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AdminListFilters>

      <div
        className={
          isPending ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'
        }
      >
        <AdminTableCard>
          <AdminTableDesktop>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No businesses found
                    </TableCell>
                  </TableRow>
                ) : (
                  businesses.map((b) => {
                    const isPublished = b.status === 'PUBLISHED';
                    const isLoading = loadingId === b.id;
                    return (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{b.name}</span>
                            {b.featuredTop && (
                              <Badge
                                variant="default"
                                className="h-4 rounded-sm border-transparent bg-red-100 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wider text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30"
                              >
                                Top
                              </Badge>
                            )}
                            {b.featuredRecommended && (
                              <Badge
                                variant="default"
                                className="h-4 rounded-sm border-transparent bg-yellow-100 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wider text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
                              >
                                Rec
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {b.categoryName || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-sm"
                                />
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-sm">
                              <DropdownMenuItem
                                render={<Link href={`/dashboard/businesses/${b.id}`} />}
                                className="rounded-sm focus:bg-muted"
                              >
                                View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <div
                                className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggle(b.id, 'featuredTop', b.featuredTop);
                                }}
                              >
                                <span>Top</span>
                                <button
                                  role="switch"
                                  aria-checked={b.featuredTop}
                                  disabled={!canToggle || !isPublished || isLoading}
                                  className={[
                                    'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                    b.featuredTop
                                      ? 'bg-zinc-900 dark:bg-zinc-100'
                                      : 'bg-zinc-300 dark:bg-zinc-600',
                                  ].join(' ')}
                                >
                                  <span
                                    className={[
                                      'pointer-events-none block h-3 w-3 rounded-full bg-white shadow-lg ring-0 transition-transform dark:bg-zinc-900',
                                      b.featuredTop ? 'translate-x-3' : 'translate-x-0',
                                    ].join(' ')}
                                  />
                                </button>
                              </div>
                              <div
                                className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggle(b.id, 'featuredRecommended', b.featuredRecommended);
                                }}
                              >
                                <span>Recommended</span>
                                <button
                                  role="switch"
                                  aria-checked={b.featuredRecommended}
                                  disabled={!canToggle || !isPublished || isLoading}
                                  className={[
                                    'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                    b.featuredRecommended
                                      ? 'bg-zinc-900 dark:bg-zinc-100'
                                      : 'bg-zinc-300 dark:bg-zinc-600',
                                  ].join(' ')}
                                >
                                  <span
                                    className={[
                                      'pointer-events-none block h-3 w-3 rounded-full bg-white shadow-lg ring-0 transition-transform dark:bg-zinc-900',
                                      b.featuredRecommended ? 'translate-x-3' : 'translate-x-0',
                                    ].join(' ')}
                                  />
                                </button>
                              </div>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="rounded-sm text-destructive focus:bg-muted focus:text-destructive">
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </AdminTableDesktop>

          <AdminTableMobile>
            {businesses.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No businesses found
              </div>
            ) : (
              businesses.map((b) => {
                const isPublished = b.status === 'PUBLISHED';
                const isLoading = loadingId === b.id;
                return (
                  <div key={b.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{b.name}</p>
                        {b.featuredTop && (
                          <Badge
                            variant="default"
                            className="h-4 rounded-sm border-transparent bg-red-100 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wider text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30"
                          >
                            Top
                          </Badge>
                        )}
                        {b.featuredRecommended && (
                          <Badge
                            variant="default"
                            className="h-4 rounded-sm border-transparent bg-yellow-100 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wider text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
                          >
                            Rec
                          </Badge>
                        )}
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{b.categoryName || '-'}</span>
                      <div className="flex items-center gap-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" />
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 rounded-sm">
                            <DropdownMenuItem
                              render={<Link href={`/dashboard/businesses/${b.id}`} />}
                              className="rounded-sm focus:bg-muted"
                            >
                              View
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <div
                              className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggle(b.id, 'featuredTop', b.featuredTop);
                              }}
                            >
                              <span>Top</span>
                              <button
                                role="switch"
                                aria-checked={b.featuredTop}
                                disabled={!canToggle || !isPublished || isLoading}
                                className={[
                                  'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                  b.featuredTop
                                    ? 'bg-zinc-900 dark:bg-zinc-100'
                                    : 'bg-zinc-300 dark:bg-zinc-600',
                                ].join(' ')}
                              >
                                <span
                                  className={[
                                    'pointer-events-none block h-3 w-3 rounded-full bg-white shadow-lg ring-0 transition-transform dark:bg-zinc-900',
                                    b.featuredTop ? 'translate-x-3' : 'translate-x-0',
                                  ].join(' ')}
                                />
                              </button>
                            </div>
                            <div
                              className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggle(b.id, 'featuredRecommended', b.featuredRecommended);
                              }}
                            >
                              <span>Recommended</span>
                              <button
                                role="switch"
                                aria-checked={b.featuredRecommended}
                                disabled={!canToggle || !isPublished || isLoading}
                                className={[
                                  'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                  b.featuredRecommended
                                    ? 'bg-zinc-900 dark:bg-zinc-100'
                                    : 'bg-zinc-300 dark:bg-zinc-600',
                                ].join(' ')}
                              >
                                <span
                                  className={[
                                    'pointer-events-none block h-3 w-3 rounded-full bg-white shadow-lg ring-0 transition-transform dark:bg-zinc-900',
                                    b.featuredRecommended ? 'translate-x-3' : 'translate-x-0',
                                  ].join(' ')}
                                />
                              </button>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="rounded-sm text-destructive focus:bg-muted focus:text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </AdminTableMobile>
        </AdminTableCard>

        <AdminPagination page={page} total={total} limit={limit} onNavigate={navigate} />
      </div>
    </AdminList>
  );
}
