'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import type { AdminConfigEntryDto } from '@kclub/contracts';

type StripePricesFormProps = {
  prices: AdminConfigEntryDto[];
};

export function StripePricesForm({ prices }: StripePricesFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const p of prices) {
      initial[p.key] = typeof p.value === 'string' ? p.value : JSON.stringify(p.value);
    }
    return initial;
  });

  async function handleSave(key: string) {
    const res = await fetch(`/api/proxy/admin-config/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: values[key] }),
    });
    if (!res.ok) {
      toast.error('Failed to save');
      return;
    }
    toast.success('Price ID updated');
    router.refresh();
  }

  if (!prices.length) {
    return (
      <p className="py-8 text-center text-muted-foreground">No Stripe price configurations found</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Value (Price ID)</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {prices.map((price) => (
          <TableRow key={price.id}>
            <TableCell className="font-mono text-sm">{price.key}</TableCell>
            <TableCell>
              <Input
                value={values[price.key] ?? ''}
                onChange={(e) => setValues({ ...values, [price.key]: e.target.value })}
                className="font-mono text-sm"
              />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {price.description ?? '—'}
            </TableCell>
            <TableCell>
              <Button variant="outline" size="xs" onClick={() => handleSave(price.key)}>
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
