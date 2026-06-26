'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Search, Star, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const canToggle =
    staffRole === 'OWNER' || staffRole === 'ADMIN' || staffRole === 'MODERATOR';

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

      <div className={isPending ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'}>

      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Recommended</TableHead>
                <TableHead className="text-center">Top</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
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
                        <div>
                          <span className="text-sm font-medium">{b.name}</span>
                          {b.categoryName && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {b.categoryName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span>{b.owner.displayName ?? b.owner.phone}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{b.owner.phone}</span>
                        </div>
                        <StatusBadge status={b.owner.membershipTier} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          role="switch"
                          aria-checked={b.featuredRecommended}
                          aria-label="Toggle recommended"
                          disabled={!canToggle || !isPublished || isLoading}
                          onClick={() => handleToggle(b.id, 'featuredRecommended', b.featuredRecommended)}
                          className={[
                            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                            b.featuredRecommended ? 'bg-primary' : 'bg-input',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                              b.featuredRecommended ? 'translate-x-4' : 'translate-x-0',
                            ].join(' ')}
                          />
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          role="switch"
                          aria-checked={b.featuredTop}
                          aria-label="Toggle top"
                          disabled={!canToggle || !isPublished || isLoading}
                          onClick={() => handleToggle(b.id, 'featuredTop', b.featuredTop)}
                          className={[
                            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                            b.featuredTop ? 'bg-primary' : 'bg-input',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                              b.featuredTop ? 'translate-x-4' : 'translate-x-0',
                            ].join(' ')}
                          />
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/businesses/${b.id}`}>
                          <Button variant="ghost" size="xs">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
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
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.categoryName}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{b.owner.displayName ?? b.owner.phone}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3 w-3" />
                        <button
                          role="switch"
                          aria-checked={b.featuredRecommended}
                          aria-label="Toggle recommended"
                          disabled={!canToggle || !isPublished || isLoading}
                          onClick={() => handleToggle(b.id, 'featuredRecommended', b.featuredRecommended)}
                          className={[
                            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                            b.featuredRecommended ? 'bg-primary' : 'bg-input',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                              b.featuredRecommended ? 'translate-x-4' : 'translate-x-0',
                            ].join(' ')}
                          />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ArrowUp className="h-3 w-3" />
                        <button
                          role="switch"
                          aria-checked={b.featuredTop}
                          aria-label="Toggle top"
                          disabled={!canToggle || !isPublished || isLoading}
                          onClick={() => handleToggle(b.id, 'featuredTop', b.featuredTop)}
                          className={[
                            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                            b.featuredTop ? 'bg-primary' : 'bg-input',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                              b.featuredTop ? 'translate-x-4' : 'translate-x-0',
                            ].join(' ')}
                          />
                        </button>
                      </div>
                      <Link href={`/dashboard/businesses/${b.id}`}>
                        <Button variant="ghost" size="xs">
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </Link>
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
