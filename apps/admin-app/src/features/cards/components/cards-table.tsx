'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RotateCcw, ShieldX } from 'lucide-react';
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
import type { AdminCardListItemDto, StaffRole } from '@kclub/contracts';

function canMutateCards(role: StaffRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

async function revokeCard(cardId: string, reason?: string) {
  const res = await fetch(`/api/proxy/cards/${cardId}/revoke`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(reason ? { reason } : {}),
  });
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
}

async function reissueCard(cardId: string, reason?: string) {
  const res = await fetch(`/api/proxy/cards/${cardId}/reissue`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(reason ? { reason } : {}),
  });
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
}

function RevokeConfirmDialog({
  cardId,
  cardNumber,
  userName,
  onAction,
}: {
  cardId: string;
  cardNumber: string;
  userName: string;
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="xs" />}>
        <ShieldX className="h-3.5 w-3.5" />
        Revoke
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke card</DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke card <strong>{cardNumber}</strong> for {userName}?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Input
            id="reason"
            placeholder="Why is this card being revoked?"
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
              const result = await revokeCard(cardId, reason || undefined);
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error ?? 'Failed to revoke card');
                return;
              }
              setOpen(false);
              toast.success('Card revoked');
              onAction();
            }}
          >
            {loading ? 'Revoking...' : 'Revoke'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReissueConfirmDialog({
  cardId,
  cardNumber,
  userName,
  onAction,
}: {
  cardId: string;
  cardNumber: string;
  userName: string;
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="xs" />}>
        <RotateCcw className="h-3.5 w-3.5" />
        Re-issue
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Re-issue card</DialogTitle>
          <DialogDescription>
            This will revoke the current card <strong>{cardNumber}</strong> for {userName} and issue
            a new one. Continue?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reissue-reason">Reason (optional)</Label>
          <Input
            id="reissue-reason"
            placeholder="Why is this card being re-issued?"
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
              const result = await reissueCard(cardId, reason || undefined);
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error ?? 'Failed to re-issue card');
                return;
              }
              setOpen(false);
              toast.success('Card re-issued');
              onAction();
            }}
          >
            {loading ? 'Re-issuing...' : 'Re-issue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type CardsTableProps = {
  cards: AdminCardListItemDto[];
  total: number;
  page: number;
  limit: number;
  search: string;
  statusFilter: string;
  tierFilter: string;
  staffRole: StaffRole;
};

export function CardsTable({
  cards,
  total,
  page,
  limit,
  search: initialSearch,
  statusFilter: initialStatus,
  tierFilter: initialTier,
  staffRole,
}: CardsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [tierFilter, setTierFilter] = useState(initialTier);
  const canMutate = canMutateCards(staffRole);

  function navigate(toPage: number) {
    const params = new URLSearchParams();
    if (toPage > 1) params.set('page', String(toPage));
    if (limit !== 20) params.set('limit', String(limit));
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (tierFilter) params.set('membershipTier', tierFilter);
    router.push(`/dashboard/cards${params.toString() ? '?' + params.toString() : ''}`);
  }

  function handleFilterChange() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (tierFilter) params.set('membershipTier', tierFilter);
    router.push(`/dashboard/cards${params.toString() ? '?' + params.toString() : ''}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    handleFilterChange();
  }

  return (
    <AdminList>
      <AdminListFilters as="form" onSubmit={handleSearch}>
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by user phone or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="flex h-9 w-[140px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="REVOKED">Revoked</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <select
          className="flex h-9 w-[140px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
        >
          <option value="all">All tiers</option>
          <option value="MEMBER">Member</option>
          <option value="VIP">VIP</option>
        </select>
        <Button type="submit" size="sm">
          Search
        </Button>
      </AdminListFilters>

      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card #</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No cards found
                  </TableCell>
                </TableRow>
              ) : (
                cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-mono text-xs">{card.cardNumber}</TableCell>
                    <TableCell>
                      <div>
                        <span className="text-sm">{card.userDisplayName ?? '—'}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {card.userPhone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={card.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={card.membershipTier} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(card.issuedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {canMutate && card.status === 'ACTIVE' ? (
                        <div className="flex items-center justify-end gap-1">
                          <RevokeConfirmDialog
                            cardId={card.id}
                            cardNumber={card.cardNumber}
                            userName={card.userDisplayName ?? card.userPhone}
                            onAction={() => router.refresh()}
                          />
                          <ReissueConfirmDialog
                            cardId={card.id}
                            cardNumber={card.cardNumber}
                            userName={card.userDisplayName ?? card.userPhone}
                            onAction={() => router.refresh()}
                          />
                        </div>
                      ) : canMutate && card.status === 'REVOKED' ? (
                        <ReissueConfirmDialog
                          cardId={card.id}
                          cardNumber={card.cardNumber}
                          userName={card.userDisplayName ?? card.userPhone}
                          onAction={() => router.refresh()}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminTableDesktop>

        <AdminTableMobile>
          {cards.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No cards found</div>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs">{card.cardNumber}</p>
                    <p className="truncate text-sm font-medium">{card.userDisplayName ?? '—'}</p>
                    <p className="font-mono text-xs text-muted-foreground">{card.userPhone}</p>
                  </div>
                  <StatusBadge status={card.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(card.issuedAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    {canMutate && card.status === 'ACTIVE' ? (
                      <>
                        <RevokeConfirmDialog
                          cardId={card.id}
                          cardNumber={card.cardNumber}
                          userName={card.userDisplayName ?? card.userPhone}
                          onAction={() => router.refresh()}
                        />
                        <ReissueConfirmDialog
                          cardId={card.id}
                          cardNumber={card.cardNumber}
                          userName={card.userDisplayName ?? card.userPhone}
                          onAction={() => router.refresh()}
                        />
                      </>
                    ) : canMutate && card.status === 'REVOKED' ? (
                      <ReissueConfirmDialog
                        cardId={card.id}
                        cardNumber={card.cardNumber}
                        userName={card.userDisplayName ?? card.userPhone}
                        onAction={() => router.refresh()}
                      />
                    ) : null}
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
