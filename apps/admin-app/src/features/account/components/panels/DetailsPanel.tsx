'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { accountContentClasses, accountPanelClasses, accountFieldLabelClasses } from '../styles';

type DetailsPanelProps = {
  staffId: string;
  staffName: string;
  staffPhone: string;
  staffRole: string;
  staffInitials: string;
};

export function DetailsPanel({ staffId, staffName, staffPhone, staffRole, staffInitials }: DetailsPanelProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(staffName);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/proxy/staff/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Failed to update profile');
      return;
    }
    toast.success('Profile updated');
    router.refresh();
  };

  return (
    <div className={accountContentClasses}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className={accountPanelClasses}>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{staffInitials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{staffName}</h2>
              <Badge variant="secondary">{staffRole}</Badge>
            </div>
          </div>
        </div>

        <div className={accountPanelClasses}>
          <h3 className="mb-4 text-sm font-semibold">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <p className={accountFieldLabelClasses}>Phone</p>
              <p className="text-sm">{staffPhone}</p>
            </div>
            <div>
              <p className={accountFieldLabelClasses}>Staff ID</p>
              <p className="font-mono text-xs text-muted-foreground">{staffId}</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || displayName === staffName}
              size="sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
