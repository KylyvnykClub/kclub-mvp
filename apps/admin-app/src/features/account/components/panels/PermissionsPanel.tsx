'use client';

import { Check, X } from 'lucide-react';

import {
  STAFF_PERMISSIONS,
  STAFF_ROLE_PERMISSIONS,
  type StaffRole,
  type StaffPermission,
} from '@kclub/contracts';

type PermissionsPanelProps = {
  staffRole: StaffRole;
};

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  DASHBOARD_METRICS_READ: 'View dashboard metrics and KPIs',
  USERS_READ: 'View user list and profiles',
  USERS_BLOCK: 'Block or unblock user accounts',
  CARDS_READ: 'View club cards',
  CARDS_REISSUE: 'Re-issue club cards',
  CARDS_REVOKE: 'Revoke club cards',
  SUBSCRIPTIONS_READ: 'View subscription data',
  SUBSCRIPTIONS_CANCEL_ADMIN: 'Cancel subscriptions on behalf of users',
  BUSINESSES_MODERATE: 'Approve, reject, or hide business profiles',
  INTRODUCTIONS_MODERATE: 'Review and manage business introductions',
  TAXONOMY_MANAGE: 'Create and edit categories, countries, cities',
  FEATURED_BUSINESSES_MANAGE: 'Toggle featured status on businesses',
  STRIPE_PRICES_MANAGE: 'Configure Stripe price IDs',
  STAFF_MANAGE: 'Manage staff accounts and role assignments',
  AUDIT_READ: 'View audit logs',
  INTERNAL_NOTES_CREATE: 'Add internal notes to entities',
};

export function PermissionsPanel({ staffRole }: PermissionsPanelProps) {
  const rolePermissions = STAFF_ROLE_PERMISSIONS[staffRole] as readonly StaffPermission[];

  return (
    <div className="p-6 sm:p-8">
      <div className="bg-card rounded-lg border p-6">
        <h3 className="mb-4 text-sm font-semibold">Permissions for role: {staffRole}</h3>
        <div className="divide-y">
          {Object.values(STAFF_PERMISSIONS).map((perm) => {
            const hasPermission = rolePermissions.includes(perm);
            return (
              <div key={perm} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{perm}</p>
                  <p className="text-xs text-muted-foreground">
                    {PERMISSION_DESCRIPTIONS[perm] ?? ''}
                  </p>
                </div>
                {hasPermission ? (
                  <Check className="h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <X className="text-muted-foreground/40 h-4 w-4 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
