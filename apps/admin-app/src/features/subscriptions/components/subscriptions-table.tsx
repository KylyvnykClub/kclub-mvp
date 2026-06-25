'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AdminList,
  AdminTableCard,
  AdminTableDesktop,
  AdminTableMobile,
} from '@/components/admin-list-layout';
import type { AdminSubscriptionListItemDto, StaffRole } from '@kclub/contracts';

async function cancelSubscription(id: string) {
  const res = await fetch(`/api/proxy/subscriptions/${id}/cancel`, { method: 'POST' });
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
}

function canCancel(role: StaffRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

type SubscriptionsTableProps = {
  subscriptions: AdminSubscriptionListItemDto[];
  staffRole: StaffRole;
};

function CancelDialog({ id, onAction }: { id: string; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="xs">
            <Ban className="h-3.5 w-3.5" />
            Cancel
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            This will set the subscription to cancel at period end. The member will lose VIP access
            after the current period.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            No, keep it
          </Button>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const result = await cancelSubscription(id);
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              setOpen(false);
              toast.success('Subscription will cancel at period end');
              onAction();
            }}
          >
            {loading ? 'Processing...' : 'Yes, cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SubscriptionsTable({ subscriptions, staffRole }: SubscriptionsTableProps) {
  const router = useRouter();
  const showCancel = canCancel(staffRole);

  return (
    <AdminList>
      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period Start</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead>Cancel at End</TableHead>
                {showCancel && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={showCancel ? 7 : 6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {sub.kind === 'VIP_MEMBERSHIP' ? 'VIP' : 'Business Placement'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{sub.user?.displayName ?? 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{sub.user?.phone ?? '—'}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sub.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.currentPeriodStart
                        ? new Date(sub.currentPeriodStart).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {sub.cancelAtPeriodEnd ? (
                        <Badge variant="destructive">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    {showCancel && (
                      <TableCell className="text-right">
                        {!sub.cancelAtPeriodEnd && sub.status === 'ACTIVE' && (
                          <CancelDialog id={sub.id} onAction={() => router.refresh()} />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminTableDesktop>

        <AdminTableMobile>
          {subscriptions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No subscriptions found
            </div>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {sub.user?.displayName ?? 'N/A'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {sub.kind === 'VIP_MEMBERSHIP' ? 'VIP' : 'Business Placement'}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {sub.user?.phone ?? '—'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="text-muted-foreground">
                    Ends: {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}
                  </div>
                  {sub.cancelAtPeriodEnd && <Badge variant="destructive">Canceling</Badge>}
                </div>
                {showCancel && !sub.cancelAtPeriodEnd && sub.status === 'ACTIVE' && (
                  <div className="flex justify-end border-t pt-3 mt-1">
                    <CancelDialog id={sub.id} onAction={() => router.refresh()} />
                  </div>
                )}
              </div>
            ))
          )}
        </AdminTableMobile>
      </AdminTableCard>
    </AdminList>
  );
}
