'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MoreHorizontal, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { MembershipTierBadge } from '@/components/membership-tier-badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';
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

const avatarColors = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(displayName: string | null, phone: string): string {
  if (!displayName) return phone.slice(-2);
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  return parts[0]!.slice(0, 2).toUpperCase();
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          'inline-block h-2 w-2 rounded-full',
          status === 'ACTIVE' && 'bg-green-500',
          status === 'BLOCKED' && 'bg-red-500',
        )}
      />
      <span className="text-sm capitalize">{status.toLowerCase()}</span>
    </span>
  );
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
  open,
  onOpenChange,
}: {
  userId: EntityId;
  userName: string;
  onAction: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
              onOpenChange(false);
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
  open,
  onOpenChange,
}: {
  userId: EntityId;
  userName: string;
  onAction: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
              onOpenChange(false);
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

function UserRowActions({
  user,
  canMutate,
  onAction,
}: {
  user: AdminUserListItemDto;
  canMutate: boolean;
  onAction: () => void;
}) {
  const [showBlock, setShowBlock] = useState(false);
  const [showUnblock, setShowUnblock] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" />}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 rounded-sm">
          <DropdownMenuItem
            render={<Link href={`/dashboard/users/${user.id}`} />}
            className="rounded-sm focus:bg-muted"
          >
            View
          </DropdownMenuItem>
          {canMutate && user.status === 'ACTIVE' && (
            <DropdownMenuItem
              className="focus:bg-destructive/10 rounded-sm text-destructive focus:text-destructive"
              onSelect={() => setShowBlock(true)}
            >
              Block
            </DropdownMenuItem>
          )}
          {canMutate && user.status === 'BLOCKED' && (
            <DropdownMenuItem
              className="rounded-sm focus:bg-muted"
              onSelect={() => setShowUnblock(true)}
            >
              Unblock
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <BlockConfirmDialog
        open={showBlock}
        onOpenChange={setShowBlock}
        userId={user.id}
        userName={user.displayName ?? user.phone}
        onAction={onAction}
      />
      <UnblockConfirmDialog
        open={showUnblock}
        onOpenChange={setShowUnblock}
        userId={user.id}
        userName={user.displayName ?? user.phone}
        onAction={onAction}
      />
    </>
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

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (tierFilter !== 'all' ? 1 : 0);

  return (
    <div className="bg-card rounded-xl border">
      {/* Card header — search & filters */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4"
      >
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              startTransition(() => {
                router.refresh();
              });
            }}
            disabled={isPending}
            aria-label="Refresh data"
            title="Refresh data"
          >
            <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
          </Button>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="min-w-0 flex-1 sm:w-[140px] sm:flex-none">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={handleTierChange}>
            <SelectTrigger className="min-w-0 flex-1 sm:w-[140px] sm:flex-none">
              <SelectValue placeholder="All tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="MEMBER">Member</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
            </SelectContent>
          </Select>
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </div>
      </form>

      {/* Table content */}
      <div
        className={
          isPending ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'
        }
      >
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const label = user.displayName ?? user.phone;
                  const initials = getInitials(user.displayName, user.phone);
                  const colorClass = getAvatarColor(label);
                  return (
                    <TableRow key={user.id} className="group">
                      <TableCell className="pl-6">
                        <Link
                          href={`/dashboard/users/${user.id}`}
                          className="flex items-center gap-3"
                        >
                          <Avatar>
                            <AvatarFallback className={colorClass}>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                              {user.displayName ?? '—'}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{user.phone}</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusDot status={user.status} />
                      </TableCell>
                      <TableCell>
                        <MembershipTierBadge tier={user.membershipTier} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <UserRowActions
                          user={user}
                          canMutate={canMutate}
                          onAction={() => router.refresh()}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y md:hidden">
          {users.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No users found</div>
          ) : (
            users.map((user) => {
              const label = user.displayName ?? user.phone;
              const initials = getInitials(user.displayName, user.phone);
              const colorClass = getAvatarColor(label);
              return (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar>
                    <AvatarFallback className={colorClass}>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/dashboard/users/${user.id}`}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {user.displayName ?? '—'}
                      </Link>
                      <StatusDot status={user.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs text-muted-foreground">{user.phone}</p>
                      <UserRowActions
                        user={user}
                        canMutate={canMutate}
                        onAction={() => router.refresh()}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination inside the card */}
        <div className="border-t px-4 sm:px-6">
          <AdminPagination page={page} total={total} limit={limit} onNavigate={navigate} />
        </div>
      </div>
    </div>
  );
}
