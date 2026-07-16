'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Plus, RotateCcw, Shield } from 'lucide-react';
import { toast } from 'sonner';

import type { AdminStaffListItemDto, StaffRole } from '@kclub/contracts';

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
import {
  AdminList,
  AdminTableCard,
  AdminTableDesktop,
  AdminTableMobile,
} from '@/components/admin-list-layout';

const STAFF_ROLE_DESCRIPTIONS = {
  OWNER: 'Full platform access, including staff management and billing configuration.',
  ADMIN: 'User, card, subscription, audit, and extended operational access.',
  MODERATOR: 'Manager-level access for business, catalog, taxonomy, and introduction moderation.',
} as const satisfies Record<StaffRole, string>;

type StaffTableProps = {
  staff: AdminStaffListItemDto[];
  staffRole: StaffRole;
};

type StaffActionDialogProps = {
  id: string;
  onAction: () => void;
};

function RoleDescription({ role }: { role: StaffRole }) {
  return <p className="text-sm text-muted-foreground">{STAFF_ROLE_DESCRIPTIONS[role]}</p>;
}

function RoleUpdateDialog({
  id,
  currentRole,
  onAction,
}: StaffActionDialogProps & {
  currentRole: StaffRole;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<StaffRole>(currentRole);
  const [confirmation, setConfirmation] = useState('');
  const requiresConfirmation = role !== currentRole;
  const canSubmit = !loading && role !== currentRole && confirmation === 'CHANGE ROLE';

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setRole(currentRole);
          setConfirmation('');
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="xs">
            <Shield className="h-3.5 w-3.5" />
            Role
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Staff Role</DialogTitle>
          <DialogDescription>
            Change dashboard permissions for this staff member. Type CHANGE ROLE to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as StaffRole)}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">OWNER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="MODERATOR">MODERATOR</SelectItem>
              </SelectContent>
            </Select>
            <RoleDescription role={role} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`role-confirm-${id}`}>Confirmation</Label>
            <Input
              id={`role-confirm-${id}`}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="CHANGE ROLE"
              disabled={!requiresConfirmation}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={async () => {
              setLoading(true);
              const res = await fetch(`/api/proxy/staff/${id}/role`, {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ role }),
              });
              setLoading(false);
              if (!res.ok) {
                toast.error('Failed to update role');
                return;
              }
              setOpen(false);
              setConfirmation('');
              toast.success('Role updated');
              onAction();
            }}
          >
            {loading ? 'Saving...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddStaffDialog({ onAction }: { onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<StaffRole>('MODERATOR');
  const [ownerConfirmation, setOwnerConfirmation] = useState('');
  const canSubmit = !loading && (role !== 'OWNER' || ownerConfirmation === 'OWNER');

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setRole('MODERATOR');
          setOwnerConfirmation('');
        }
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add staff
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Approved Staff Phone</DialogTitle>
          <DialogDescription>
            The staff member can register a password after this phone is approved. MODERATOR is
            manager-level access.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (role === 'OWNER' && ownerConfirmation !== 'OWNER') {
              toast.error('Type OWNER to approve owner access');
              return;
            }
            setLoading(true);
            const formData = new FormData(event.currentTarget);
            const res = await fetch('/api/proxy/staff', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                phone: String(formData.get('phone') ?? ''),
                displayName: String(formData.get('displayName') ?? '').trim() || undefined,
                role,
              }),
            });
            setLoading(false);
            if (!res.ok) {
              toast.error('Failed to add staff');
              return;
            }
            setOpen(false);
            setOwnerConfirmation('');
            setRole('MODERATOR');
            toast.success('Staff phone approved');
            onAction();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="staff-phone">Phone</Label>
            <Input id="staff-phone" name="phone" placeholder="+1 (___) ___-____" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-display-name">Display name</Label>
            <Input id="staff-display-name" name="displayName" placeholder="Staff name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as StaffRole)}>
              <SelectTrigger id="staff-role" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">OWNER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="MODERATOR">MODERATOR</SelectItem>
              </SelectContent>
            </Select>
            <RoleDescription role={role} />
          </div>
          {role === 'OWNER' && (
            <div className="space-y-2">
              <Label htmlFor="staff-owner-confirm">Owner confirmation</Label>
              <Input
                id="staff-owner-confirm"
                value={ownerConfirmation}
                onChange={(event) => setOwnerConfirmation(event.target.value)}
                placeholder="OWNER"
              />
              <p className="text-sm text-muted-foreground">
                Type OWNER to approve full platform ownership access.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {loading ? 'Saving...' : 'Approve phone'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ id, onAction }: StaffActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Staff Password</DialogTitle>
          <DialogDescription>
            This clears the password and revokes active sessions. The staff member can register a
            new password with their approved phone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const res = await fetch(`/api/proxy/staff/${id}/password-reset`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ reason: 'OWNER reset from admin settings' }),
              });
              setLoading(false);
              if (!res.ok) {
                toast.error('Failed to reset password');
                return;
              }
              setOpen(false);
              toast.success('Password reset');
              onAction();
            }}
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeactivateStaffDialog({ id, onAction }: StaffActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setConfirmation('');
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="xs">
            <Ban className="h-3.5 w-3.5" />
            Deactivate
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate Staff</DialogTitle>
          <DialogDescription>
            This blocks future sign-in and revokes active sessions for this staff member. Type
            DEACTIVATE to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={`deactivate-confirm-${id}`}>Confirmation</Label>
          <Input
            id={`deactivate-confirm-${id}`}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="DEACTIVATE"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading || confirmation !== 'DEACTIVATE'}
            onClick={async () => {
              setLoading(true);
              const res = await fetch(`/api/proxy/staff/${id}/deactivate`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ reason: 'OWNER deactivated from admin settings' }),
              });
              setLoading(false);
              if (!res.ok) {
                toast.error('Failed to deactivate staff');
                return;
              }
              setOpen(false);
              setConfirmation('');
              toast.success('Staff deactivated');
              onAction();
            }}
          >
            {loading ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StaffTable({ staff, staffRole }: StaffTableProps) {
  const router = useRouter();
  const canManageStaff = staffRole === 'OWNER';
  const refresh = () => router.refresh();

  if (!staff.length) {
    return (
      <div className="space-y-4">
        {canManageStaff ? <AddStaffDialog onAction={refresh} /> : null}
        <p className="py-8 text-center text-muted-foreground">No staff found</p>
      </div>
    );
  }

  return (
    <AdminList>
      <div className="flex justify-end">
        {canManageStaff ? <AddStaffDialog onAction={refresh} /> : null}
      </div>
      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>{s.displayName ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? 'default' : 'secondary'}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.passwordStatus === 'SET' ? 'default' : 'secondary'}>
                      {s.passwordStatus === 'SET' ? 'Set' : 'Not set'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canManageStaff && s.isActive ? (
                      <div className="flex flex-wrap gap-2">
                        <RoleUpdateDialog id={s.id} currentRole={s.role} onAction={refresh} />
                        <ResetPasswordDialog id={s.id} onAction={refresh} />
                        <DeactivateStaffDialog id={s.id} onAction={refresh} />
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableDesktop>

        <AdminTableMobile>
          {staff.map((s) => (
            <div key={s.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.displayName ?? '-'}</p>
                  <p className="font-mono text-xs text-muted-foreground">{s.phone}</p>
                </div>
                <Badge variant={s.isActive ? 'default' : 'secondary'}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{s.role}</Badge>
                  <Badge variant={s.passwordStatus === 'SET' ? 'default' : 'secondary'}>
                    {s.passwordStatus === 'SET' ? 'Password set' : 'No password'}
                  </Badge>
                </div>
                {canManageStaff && s.isActive ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    <RoleUpdateDialog id={s.id} currentRole={s.role} onAction={refresh} />
                    <ResetPasswordDialog id={s.id} onAction={refresh} />
                    <DeactivateStaffDialog id={s.id} onAction={refresh} />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </AdminTableMobile>
      </AdminTableCard>
    </AdminList>
  );
}
