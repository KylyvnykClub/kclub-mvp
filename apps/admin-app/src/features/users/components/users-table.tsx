'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ban, CheckCircle, ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { AdminUserListItemDto, EntityId, StaffRole } from '@kclub/contracts';

function canMutateUsers(role: StaffRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

async function blockUser(userId: string, reason?: string) {
  const res = await fetch(`/api/proxy/users/${userId}/block`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(reason ? { reason } : {}),
  });
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
}

async function unblockUser(userId: string, reason?: string) {
  const res = await fetch(`/api/proxy/users/${userId}/unblock`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(reason ? { reason } : {}),
  });
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
}

type UsersTableProps = {
  users: AdminUserListItemDto[];
  total: number;
  page: number;
  limit: number;
  search: string;
  statusFilter: string;
  tierFilter: string;
  staffRole: StaffRole;
};

function BlockConfirmDialog({
  userId,
  userName,
  onAction,
}: {
  userId: EntityId;
  userName: string;
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="xs" />}>
        <Ban className="h-3.5 w-3.5" />
        Block
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block user</DialogTitle>
          <DialogDescription>
            Are you sure you want to block {userName}? They will lose access to their account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="block-reason">Reason (optional)</Label>
          <Input
            id="block-reason"
            placeholder="Why is this user being blocked?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const result = await blockUser(userId, reason || undefined);
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error ?? 'Failed to block user');
                return;
              }
              setOpen(false);
              toast.success('User blocked');
              onAction();
            }}
          >
            {loading ? 'Blocking...' : 'Block'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UnblockConfirmDialog({
  userId,
  userName,
  onAction,
}: {
  userId: EntityId;
  userName: string;
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="xs" />}>
        <CheckCircle className="h-3.5 w-3.5" />
        Unblock
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unblock user</DialogTitle>
          <DialogDescription>Restore access for {userName}?</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="unblock-reason">Reason (optional)</Label>
          <Input
            id="unblock-reason"
            placeholder="Why is this user being unblocked?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const result = await unblockUser(userId, reason || undefined);
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error ?? 'Failed to unblock user');
                return;
              }
              setOpen(false);
              toast.success('User unblocked');
              onAction();
            }}
          >
            {loading ? 'Unblocking...' : 'Unblock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UsersTable({
  users,
  total,
  page,
  limit,
  search: initialSearch,
  statusFilter: initialStatus,
  tierFilter: initialTier,
  staffRole,
}: UsersTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [tierFilter, setTierFilter] = useState(initialTier);
  const canMutate = canMutateUsers(staffRole);

  function buildUrl(overrides: { page?: number; search?: string; status?: string; tier?: string }) {
    const params = new URLSearchParams();
    const p = overrides.page ?? 1;
    const s = overrides.search ?? search;
    const st = overrides.status ?? statusFilter;
    const t = overrides.tier ?? tierFilter;
    if (p > 1) params.set('page', String(p));
    if (limit !== 20) params.set('limit', String(limit));
    if (s) params.set('search', s);
    if (st && st !== 'all') params.set('status', st);
    if (t && t !== 'all') params.set('membershipTier', t);
    return `/dashboard/users${params.toString() ? '?' + params.toString() : ''}`;
  }

  function navigate(toPage: number) {
    startTransition(() => router.push(buildUrl({ page: toPage })));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => router.push(buildUrl({ page: 1 })));
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    startTransition(() => router.push(buildUrl({ status: value, page: 1 })));
  }

  function handleTierChange(value: string) {
    setTierFilter(value);
    startTransition(() => router.push(buildUrl({ tier: value, page: 1 })));
  }

  return (
    <AdminList>
      <AdminListFilters as="form" onSubmit={handleSearch}>
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by phone or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="flex h-9 w-[140px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        <select
          className="flex h-9 w-[140px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={tierFilter}
          onChange={(e) => handleTierChange(e.target.value)}
        >
          <option value="all">All tiers</option>
          <option value="MEMBER">Member</option>
          <option value="VIP">VIP</option>
        </select>
        <Button type="submit" size="sm" disabled={isPending}>
          Search
        </Button>
      </AdminListFilters>

      <div className={isPending ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'}>

      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.displayName ?? '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.membershipTier} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/users/${user.id}`}>
                          <Button variant="ghost" size="xs">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {canMutate ? (
                          user.status === 'ACTIVE' ? (
                            <BlockConfirmDialog
                              userId={user.id}
                              userName={user.displayName ?? user.phone}
                              onAction={() => router.refresh()}
                            />
                          ) : (
                            <UnblockConfirmDialog
                              userId={user.id}
                              userName={user.displayName ?? user.phone}
                              onAction={() => router.refresh()}
                            />
                          )
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminTableDesktop>

        <AdminTableMobile>
          {users.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No users found</div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.displayName ?? '—'}</p>
                  </div>
                  <StatusBadge status={user.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/users/${user.id}`}>
                      <Button variant="ghost" size="xs">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>
                    {canMutate ? (
                      user.status === 'ACTIVE' ? (
                        <BlockConfirmDialog
                          userId={user.id}
                          userName={user.displayName ?? user.phone}
                          onAction={() => router.refresh()}
                        />
                      ) : (
                        <UnblockConfirmDialog
                          userId={user.id}
                          userName={user.displayName ?? user.phone}
                          onAction={() => router.refresh()}
                        />
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </AdminTableMobile>
      </AdminTableCard>

      <AdminPagination page={page} total={total} limit={limit} onNavigate={navigate} />
      </div>
    </AdminList>
  );
}
