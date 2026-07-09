'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import {
  AdminList,
  AdminListFilters,
  AdminTableCard,
  AdminTableDesktop,
  AdminTableMobile,
} from '@/components/admin-list-layout';
import type { CountryDto } from '@kclub/contracts';

type CountriesTableProps = {
  countries: CountryDto[];
};

function CountryFormDialog({
  mode,
  country,
  onAction,
}: {
  mode: 'create' | 'edit';
  country?: CountryDto;
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code2, setCode2] = useState(country?.code2 ?? '');
  const [code3, setCode3] = useState(country?.code3 ?? '');
  const [name, setName] = useState(country?.name ?? '');
  const [slug, setSlug] = useState(country?.slug ?? '');
  const [isActive, setIsActive] = useState(country?.isActive ?? true);

  async function handleSubmit() {
    setLoading(true);
    const body = { code2, code3: code3 || undefined, name, slug, isActive };
    const url = mode === 'create' ? '/api/proxy/countries' : `/api/proxy/countries/${country!.id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(`Failed to ${mode} country`);
      return;
    }
    setOpen(false);
    toast.success(mode === 'create' ? 'Country created' : 'Country updated');
    onAction();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          mode === 'create' ? (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Country
            </Button>
          ) : (
            <Button variant="outline" size="xs">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Country' : 'Edit Country'}</DialogTitle>
          <DialogDescription>Enter country details below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code2">Code (ISO 2)</Label>
              <Input
                id="code2"
                maxLength={2}
                value={code2}
                onChange={(e) => setCode2(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code3">Code (ISO 3)</Label>
              <Input
                id="code3"
                maxLength={3}
                value={code3}
                onChange={(e) => setCode3(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading || !code2.trim() || !name.trim() || !slug.trim()}
            onClick={handleSubmit}
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCountryDialog({
  id,
  name,
  onAction,
}: {
  id: string;
  name: string;
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="xs">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Country</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{name}&rdquo;? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const res = await fetch(`/api/proxy/countries/${id}`, { method: 'DELETE' });
              setLoading(false);
              if (!res.ok) {
                toast.error('Failed to delete country');
                return;
              }
              setOpen(false);
              toast.success('Country deleted');
              onAction();
            }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CountriesTable({ countries }: CountriesTableProps) {
  const router = useRouter();

  return (
    <AdminList>
      <AdminListFilters className="justify-end">
        <CountryFormDialog mode="create" onAction={() => router.refresh()} />
      </AdminListFilters>

      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ISO 2</TableHead>
                <TableHead>ISO 3</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No countries found
                  </TableCell>
                </TableRow>
              ) : (
                countries.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.code2}</TableCell>
                    <TableCell>{c.code3 ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? 'default' : 'secondary'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CountryFormDialog
                          mode="edit"
                          country={c}
                          onAction={() => router.refresh()}
                        />
                        <DeleteCountryDialog
                          id={c.id}
                          name={c.name}
                          onAction={() => router.refresh()}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminTableDesktop>

        <AdminTableMobile>
          {countries.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No countries found</div>
          ) : (
            countries.map((c) => (
              <div key={c.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.code2} {c.code3 ? `/ ${c.code3}` : ''}
                    </p>
                  </div>
                  <Badge variant={c.isActive ? 'default' : 'secondary'}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.slug}</span>
                  <div className="flex items-center gap-1">
                    <CountryFormDialog mode="edit" country={c} onAction={() => router.refresh()} />
                    <DeleteCountryDialog
                      id={c.id}
                      name={c.name}
                      onAction={() => router.refresh()}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </AdminTableMobile>
      </AdminTableCard>
    </AdminList>
  );
}
