'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
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
import {
  AdminList,
  AdminTableCard,
  AdminTableDesktop,
  AdminTableMobile,
} from '@/components/admin-list-layout';
import type { AdminIntroductionListItemDto, StaffRole } from '@kclub/contracts';

async function approveIntroduction(id: string, notes?: string) {
  const res = await fetch(`/api/proxy/introductions/${id}/approve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(notes ? { notes } : {}),
  });
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
}

async function rejectIntroduction(id: string, reason: string) {
  const res = await fetch(`/api/proxy/introductions/${id}/reject`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
}

async function completeIntroduction(id: string) {
  const res = await fetch(`/api/proxy/introductions/${id}/complete`, {
    method: 'POST',
  });
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
}

type IntroductionsTableProps = {
  introductions: AdminIntroductionListItemDto[];
  staffRole: StaffRole;
};

function ApproveDialog({ id, onAction }: { id: string; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="default" size="xs">
            <CheckCircle className="h-3.5 w-3.5" />
            Approve
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Introduction</DialogTitle>
          <DialogDescription>Optional notes for this introduction approval.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
              const result = await approveIntroduction(id, notes || undefined);
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              setOpen(false);
              toast.success('Introduction approved');
              onAction();
            }}
          >
            {loading ? 'Processing...' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ id, onAction }: { id: string; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="xs">
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Introduction</DialogTitle>
          <DialogDescription>Provide a reason for rejection.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Input
            id="reason"
            placeholder="Required rejection reason..."
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
            disabled={loading || !reason.trim()}
            onClick={async () => {
              setLoading(true);
              const result = await rejectIntroduction(id, reason.trim());
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              setOpen(false);
              toast.success('Introduction rejected');
              onAction();
            }}
          >
            {loading ? 'Processing...' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompleteDialog({ id, onAction }: { id: string; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="secondary" size="xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Complete
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Introduction</DialogTitle>
          <DialogDescription>Mark this introduction as completed.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const result = await completeIntroduction(id);
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              setOpen(false);
              toast.success('Introduction completed');
              onAction();
            }}
          >
            {loading ? 'Processing...' : 'Complete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function IntroductionsTable({ introductions, staffRole }: IntroductionsTableProps) {
  const router = useRouter();

  const canMutate = staffRole === 'OWNER' || staffRole === 'ADMIN' || staffRole === 'MODERATOR';

  return (
    <AdminList>
      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Target Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Created</TableHead>
                {canMutate && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {introductions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canMutate ? 6 : 5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No introductions found
                  </TableCell>
                </TableRow>
              ) : (
                introductions.map((intro) => (
                  <TableRow key={intro.id}>
                    <TableCell className="max-w-[200px] truncate">
                      <div className="text-sm font-medium">{intro.requesterBusiness.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {intro.requesterUser.displayName ?? intro.requesterUser.phone}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {intro.targetBusiness.name}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={intro.status} />
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {intro.message ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(intro.createdAt).toLocaleDateString()}
                    </TableCell>
                    {canMutate && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(intro.status === 'SUBMITTED' || intro.status === 'IN_REVIEW') && (
                            <>
                              <ApproveDialog id={intro.id} onAction={() => router.refresh()} />
                              <RejectDialog id={intro.id} onAction={() => router.refresh()} />
                            </>
                          )}
                          {intro.status === 'APPROVED' && (
                            <CompleteDialog id={intro.id} onAction={() => router.refresh()} />
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminTableDesktop>

        <AdminTableMobile>
          {introductions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No introductions found
            </div>
          ) : (
            introductions.map((intro) => (
              <div key={intro.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {intro.requesterBusiness.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      → {intro.targetBusiness.name}
                    </p>
                  </div>
                  <StatusBadge status={intro.status} />
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {intro.message ? `"${intro.message}"` : 'No message'}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(intro.createdAt).toLocaleDateString()}</span>
                  {canMutate && (
                    <div className="flex items-center gap-1">
                      {(intro.status === 'SUBMITTED' || intro.status === 'IN_REVIEW') && (
                        <>
                          <ApproveDialog id={intro.id} onAction={() => router.refresh()} />
                          <RejectDialog id={intro.id} onAction={() => router.refresh()} />
                        </>
                      )}
                      {intro.status === 'APPROVED' && (
                        <CompleteDialog id={intro.id} onAction={() => router.refresh()} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </AdminTableMobile>
      </AdminTableCard>
    </AdminList>
  );
}
