'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

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
import type { AdminStaffListItemDto } from '@kclub/contracts';

type StaffTableProps = {
  staff: AdminStaffListItemDto[];
};

function RoleUpdateDialog({
  id,
  currentRole,
  onAction,
}: {
  id: string;
  currentRole: string;
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(currentRole);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="xs">
            <Shield className="h-3.5 w-3.5" />
            Change Role
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Staff Role</DialogTitle>
          <DialogDescription>Change the role for this staff member.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
          >
            <option value="OWNER">OWNER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MODERATOR">MODERATOR</option>
          </select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading || role === currentRole}
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

export function StaffTable({ staff }: StaffTableProps) {
  const router = useRouter();

  if (!staff.length) {
    return <p className="py-8 text-center text-muted-foreground">No staff found</p>;
  }

  return (
    <AdminList>
      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TOTP</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>{s.displayName ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? 'default' : 'secondary'}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.totpVerified ? 'default' : 'secondary'}>
                      {s.totpVerified ? 'Verified' : 'Not set'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {s.isActive && (
                      <RoleUpdateDialog
                        id={s.id}
                        currentRole={s.role}
                        onAction={() => router.refresh()}
                      />
                    )}
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
                  <p className="truncate text-sm font-medium">{s.displayName ?? '—'}</p>
                  <p className="font-mono text-xs text-muted-foreground">{s.phone}</p>
                </div>
                <Badge variant={s.isActive ? 'default' : 'secondary'}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{s.role}</Badge>
                  <Badge variant={s.totpVerified ? 'default' : 'secondary'}>
                    {s.totpVerified ? 'TOTP' : 'No TOTP'}
                  </Badge>
                </div>
                <div>
                  {s.isActive && (
                    <RoleUpdateDialog
                      id={s.id}
                      currentRole={s.role}
                      onAction={() => router.refresh()}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </AdminTableMobile>
      </AdminTableCard>
    </AdminList>
  );
}
