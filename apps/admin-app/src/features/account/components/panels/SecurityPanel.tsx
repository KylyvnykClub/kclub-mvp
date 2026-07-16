'use client';

import { KeyRound, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

export function SecurityPanel() {
  return (
    <div className="space-y-6 p-6 sm:p-8">
      <div className="bg-card rounded-lg border p-6">
        <h3 className="mb-4 text-sm font-semibold">Password Access</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Approved phone and password</p>
              <p className="text-xs text-muted-foreground">
                Staff access is limited to phone numbers approved by an OWNER.
              </p>
            </div>
          </div>
          <Badge variant="default">Active</Badge>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-green-600" />
          <div>
            <h3 className="mb-2 text-sm font-semibold">Session</h3>
            <p className="text-sm text-muted-foreground">
              Your session is managed via a secure token with an 8-hour expiry. Sign out to
              invalidate the current session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
