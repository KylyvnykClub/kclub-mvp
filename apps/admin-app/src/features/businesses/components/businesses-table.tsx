'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Search } from 'lucide-react';

import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

type BusinessesTableProps = {
  businesses: AdminBusinessListItemDto[];
  total: number;
  page: number;
  limit: number;
  statusFilter: string;
  staffRole: StaffRole;
};

export function BusinessesTable({
  businesses,
  total,
  page,
  limit,
  statusFilter: initialStatus,
}: BusinessesTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  function navigate(toPage: number) {
    const params = new URLSearchParams();
    if (toPage > 1) params.set('page', String(toPage));
    if (limit !== 20) params.set('limit', String(limit));
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
    router.push(`/dashboard/businesses${params.toString() ? '?' + params.toString() : ''}`);
  }

  function handleFilterChange() {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
    router.push(`/dashboard/businesses${params.toString() ? '?' + params.toString() : ''}`);
  }

  return (
    <AdminList>
      <AdminListFilters>
        <select
          className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
          }}
        >
          <option value="all">All statuses</option>
          {BUSINESS_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={handleFilterChange}>
          Filter
        </Button>
      </AdminListFilters>

      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No businesses found
                  </TableCell>
                </TableRow>
              ) : (
                businesses.map((b) => (
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
                    <TableCell>
                      {b.placementSubscription ? (
                        <StatusBadge status={b.placementSubscription.status} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
                ))
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
            businesses.map((b) => (
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
                  <div className="flex items-center gap-1">
                    {b.placementSubscription && (
                      <StatusBadge status={b.placementSubscription.status} />
                    )}
                    <Link href={`/dashboard/businesses/${b.id}`}>
                      <Button variant="ghost" size="xs">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </AdminTableMobile>
      </AdminTableCard>

      <AdminPagination page={page} total={total} limit={limit} onNavigate={navigate} />
    </AdminList>
  );
}
