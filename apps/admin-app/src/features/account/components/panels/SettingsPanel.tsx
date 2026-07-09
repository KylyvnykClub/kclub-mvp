'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import type { StaffRole } from '@kclub/contracts';

type SettingsPanelProps = {
  staffRole: StaffRole;
};

export function SettingsPanel({ staffRole }: SettingsPanelProps) {
  return (
    <div className="space-y-6 p-6 sm:p-8">
      <div className="bg-card rounded-lg border p-6">
        <h3 className="mb-4 text-sm font-semibold">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">
              Switch between light, dark, or system theme
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {(staffRole === 'OWNER' || staffRole === 'ADMIN') && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="mb-4 text-sm font-semibold">Administration</h3>
          <Link
            href="/dashboard/settings"
            className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Platform Settings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
