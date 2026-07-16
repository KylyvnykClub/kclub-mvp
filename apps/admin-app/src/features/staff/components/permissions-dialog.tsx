'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import {
  ALL_STAFF_PERMISSIONS,
  STAFF_ROLE_PERMISSIONS,
  type AdminStaffListItemDto,
  type StaffPermission,
  type StaffRole,
} from '@kclub/contracts';

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

const PERMISSION_LABELS: Record<string, string> = {
  DASHBOARD_METRICS_READ: 'Dashboard Metrics',
  FINANCE_METRICS_READ: 'Finance Metrics',
  USERS_READ: 'View Users',
  USERS_BLOCK: 'Block / Unblock Users',
  CARDS_READ: 'View Cards',
  CARDS_REISSUE: 'Reissue Cards',
  CARDS_REVOKE: 'Revoke Cards',
  SUBSCRIPTIONS_READ: 'View Subscriptions',
  SUBSCRIPTIONS_CANCEL_ADMIN: 'Cancel Subscriptions',
  BUSINESSES_MODERATE: 'Moderate Businesses',
  INTRODUCTIONS_MODERATE: 'Moderate Introductions',
  TAXONOMY_MANAGE: 'Manage Taxonomy',
  FEATURED_BUSINESSES_MANAGE: 'Manage Featured',
  STRIPE_PRICES_MANAGE: 'Manage Stripe Prices',
  STAFF_MANAGE: 'Manage Staff',
  AUDIT_READ: 'View Audit Log',
  INTERNAL_NOTES_CREATE: 'Create Internal Notes',
};

type PermissionState = 'role' | 'granted' | 'denied' | 'none';

function getPermissionState(
  permission: StaffPermission,
  role: StaffRole,
  granted: Set<string>,
  denied: Set<string>,
): PermissionState {
  if (denied.has(permission)) return 'denied';
  if (granted.has(permission)) return 'granted';
  const rolePerms = STAFF_ROLE_PERMISSIONS[role] as readonly StaffPermission[];
  if (rolePerms.includes(permission)) return 'role';
  return 'none';
}

export function PermissionsDialog({ staff }: { staff: AdminStaffListItemDto }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState<Set<string>>(
    new Set(staff.permissionOverrides?.granted ?? []),
  );
  const [denied, setDenied] = useState<Set<string>>(
    new Set(staff.permissionOverrides?.denied ?? []),
  );

  const rolePerms = STAFF_ROLE_PERMISSIONS[staff.role] as readonly StaffPermission[];

  function handleToggle(permission: StaffPermission) {
    const state = getPermissionState(permission, staff.role, granted, denied);
    const nextGranted = new Set(granted);
    const nextDenied = new Set(denied);

    if (rolePerms.includes(permission)) {
      if (state === 'role') {
        nextDenied.add(permission);
      } else if (state === 'denied') {
        nextDenied.delete(permission);
      }
    } else {
      if (state === 'none') {
        nextGranted.add(permission);
      } else if (state === 'granted') {
        nextGranted.delete(permission);
      }
    }

    setGranted(nextGranted);
    setDenied(nextDenied);
  }

  async function handleSave() {
    setLoading(true);
    const res = await fetch(`/api/proxy/staff/${staff.id}/permissions`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        granted: Array.from(granted),
        denied: Array.from(denied),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error('Failed to update permissions');
      return;
    }
    setOpen(false);
    toast.success('Permissions updated');
    router.refresh();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setGranted(new Set(staff.permissionOverrides?.granted ?? []));
      setDenied(new Set(staff.permissionOverrides?.denied ?? []));
    }
    setOpen(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="xs">
            <ShieldCheck className="h-3.5 w-3.5" />
          </Button>
        }
      />
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Permissions — {staff.displayName ?? staff.phone}</DialogTitle>
          <DialogDescription>
            Role: <strong>{staff.role}</strong>. Toggle individual permissions. Changes override the
            role defaults.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 py-2">
          {ALL_STAFF_PERMISSIONS.map((permission) => {
            const state = getPermissionState(
              permission as StaffPermission,
              staff.role,
              granted,
              denied,
            );
            const isChecked = state === 'role' || state === 'granted';
            const label = PERMISSION_LABELS[permission] ?? permission;

            return (
              <div
                key={permission}
                className="hover:bg-muted/50 flex items-center gap-3 rounded-md px-2 py-1.5"
              >
                <input
                  type="checkbox"
                  id={`perm-${permission}`}
                  checked={isChecked}
                  onChange={() => handleToggle(permission as StaffPermission)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label
                  htmlFor={`perm-${permission}`}
                  className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-normal"
                >
                  {label}
                  {state === 'granted' && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      +grant
                    </span>
                  )}
                  {state === 'denied' && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      −deny
                    </span>
                  )}
                  {state === 'role' && (
                    <span className="text-[10px] text-muted-foreground">role</span>
                  )}
                </Label>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={handleSave}>
            {loading ? 'Saving...' : 'Save Permissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
