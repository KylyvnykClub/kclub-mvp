'use client';

import Link from 'next/link';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

type SecurityPanelProps = {
  totpVerified: boolean;
};

export function SecurityPanel({ totpVerified }: SecurityPanelProps) {
  return (
    <div className="space-y-6 p-6 sm:p-8">
      <div className="bg-card rounded-lg border p-6">
        <h3 className="mb-4 text-sm font-semibold">Two-Factor Authentication</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {totpVerified ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-yellow-600" />
            )}
            <div>
              <p className="text-sm font-medium">TOTP Authenticator</p>
              <p className="text-xs text-muted-foreground">
                {totpVerified ? 'Configured and verified' : 'Not configured'}
              </p>
            </div>
          </div>
          <Badge variant={totpVerified ? 'default' : 'secondary'}>
            {totpVerified ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="mt-4">
          <Link
            href="/auth/totp-setup"
            className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {totpVerified ? 'Reset TOTP' : 'Setup TOTP'}
          </Link>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <h3 className="mb-4 text-sm font-semibold">Session</h3>
        <p className="text-sm text-muted-foreground">
          Your session is managed via a secure JWT token with an 8-hour expiry. Sign out to
          invalidate the current session.
        </p>
      </div>
    </div>
  );
}
