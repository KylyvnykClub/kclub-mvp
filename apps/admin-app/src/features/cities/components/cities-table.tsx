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
import type { CityDto, CountryDto } from '@kclub/contracts';

type CitiesTableProps = {
  cities: CityDto[];
  countries: CountryDto[];
};

function CityFormDialog({
  mode,
  city,
  countries,
  onAction,
}: {
  mode: 'create' | 'edit';
  city?: CityDto;
  countries: CountryDto[];
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countryId, setCountryId] = useState(city?.countryId ?? '');
  const [name, setName] = useState(city?.name ?? '');
  const [slug, setSlug] = useState(city?.slug ?? '');
  const [isActive, setIsActive] = useState(city?.isActive ?? true);

  async function handleSubmit() {
    setLoading(true);
    const body = { countryId, name, slug, isActive };
    const url = mode === 'create' ? '/api/proxy/cities' : `/api/proxy/cities/${city!.id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(`Failed to ${mode} city`);
      return;
    }
    setOpen(false);
    toast.success(mode === 'create' ? 'City created' : 'City updated');
    onAction();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          mode === 'create' ? (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add City
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
          <DialogTitle>{mode === 'create' ? 'Create City' : 'Edit City'}</DialogTitle>
          <DialogDescription>Enter city details below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
            disabled={loading || !countryId || !name.trim() || !slug.trim()}
            onClick={handleSubmit}
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCityDialog({
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
          <DialogTitle>Delete City</DialogTitle>
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
              const res = await fetch(`/api/proxy/cities/${id}`, { method: 'DELETE' });
              setLoading(false);
              if (!res.ok) {
                toast.error('Failed to delete city');
                return;
              }
              setOpen(false);
              toast.success('City deleted');
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

export function CitiesTable({ cities, countries }: CitiesTableProps) {
  const router = useRouter();

  return (
    <AdminList>
      <AdminListFilters className="justify-end">
        <CityFormDialog mode="create" countries={countries} onAction={() => router.refresh()} />
      </AdminListFilters>

      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No cities found
                  </TableCell>
                </TableRow>
              ) : (
                cities.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell className="font-medium">{city.name}</TableCell>
                    <TableCell>{city.countryName}</TableCell>
                    <TableCell className="text-muted-foreground">{city.slug}</TableCell>
                    <TableCell>
                      <Badge variant={city.isActive ? 'default' : 'secondary'}>
                        {city.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CityFormDialog
                          mode="edit"
                          city={city}
                          countries={countries}
                          onAction={() => router.refresh()}
                        />
                        <DeleteCityDialog
                          id={city.id}
                          name={city.name}
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
          {cities.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No cities found</div>
          ) : (
            cities.map((city) => (
              <div key={city.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{city.name}</p>
                    <p className="text-xs text-muted-foreground">{city.countryName}</p>
                  </div>
                  <Badge variant={city.isActive ? 'default' : 'secondary'}>
                    {city.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{city.slug}</span>
                  <div className="flex items-center gap-1">
                    <CityFormDialog
                      mode="edit"
                      city={city}
                      countries={countries}
                      onAction={() => router.refresh()}
                    />
                    <DeleteCityDialog
                      id={city.id}
                      name={city.name}
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
