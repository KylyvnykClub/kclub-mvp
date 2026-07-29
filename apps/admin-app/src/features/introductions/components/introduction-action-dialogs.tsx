'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

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

export function ApproveDialog({ id, onAction }: { id: string; onAction: () => void }) {
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

export function RejectDialog({ id, onAction }: { id: string; onAction: () => void }) {
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

export function CompleteDialog({ id, onAction }: { id: string; onAction: () => void }) {
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

export function IntroductionActions({
  id,
  status,
  canMutate,
  onAction,
}: {
  id: string;
  status: string;
  canMutate: boolean;
  onAction: () => void;
}) {
  if (!canMutate) return null;

  return (
    <div className="flex items-center gap-1">
      {(status === 'SUBMITTED' || status === 'IN_REVIEW') && (
        <>
          <ApproveDialog id={id} onAction={onAction} />
          <RejectDialog id={id} onAction={onAction} />
        </>
      )}
      {status === 'APPROVED' && <CompleteDialog id={id} onAction={onAction} />}
    </div>
  );
}
