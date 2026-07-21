'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useList, useCreate, useUpdate, useDelete, useCan } from '@refinedev/core';
import { Pencil, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { countryCreateSchema } from '@kclub/validation';
import type { z } from 'zod';
import type { CountryDto } from '@kclub/contracts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

const RESOURCE = 'countries';
type CountryFormValues = z.input<typeof countryCreateSchema>;

function CountryFormDialog({
  mode,
  country,
  onClose,
}: {
  mode: 'create' | 'edit';
  country?: CountryDto;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CountryFormValues>({
    resolver: zodResolver(countryCreateSchema),
    defaultValues: {
      code2: country?.code2 ?? '',
      code3: country?.code3 ?? '',
      name: country?.name ?? '',
      slug: country?.slug ?? '',
      isActive: country?.isActive ?? true,
    },
  });

  const createMutation = useCreate<CountryDto>();
  const updateMutation = useUpdate<CountryDto>();
  const isSaving = createMutation.mutation.isPending || updateMutation.mutation.isPending;

  function onSubmit(values: CountryFormValues) {
    const payload = { ...values, code3: values.code3 || undefined };
    if (mode === 'create') {
      createMutation.mutate(
        { resource: RESOURCE, values: payload },
        {
          onSuccess: () => { toast.success('Country created'); onClose(); },
          onError: () => toast.error('Failed to create country'),
        },
      );
    } else {
      updateMutation.mutate(
        { resource: RESOURCE, id: country!.id, values: payload },
        {
          onSuccess: () => { toast.success('Country updated'); onClose(); },
          onError: () => toast.error('Failed to update country'),
        },
      );
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === 'create' ? 'Create Country' : 'Edit Country'}</DialogTitle>
        <DialogDescription>Enter country details below.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code2">Code (ISO 2)</Label>
            <Input id="code2" maxLength={2} {...register('code2')} className="uppercase" />
            {errors.code2 && <p className="text-xs text-destructive">{errors.code2.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="code3">Code (ISO 3)</Label>
            <Input id="code3" maxLength={3} {...register('code3')} className="uppercase" />
            {errors.code3 && <p className="text-xs text-destructive">{errors.code3.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...register('slug')} />
          {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            {...register('isActive')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSaving || !isValid}>
            {isSaving ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function DeleteCountryDialog({
  country,
  onClose,
}: {
  country: CountryDto;
  onClose: () => void;
}) {
  const deleteMutation = useDelete();

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Country</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete &ldquo;{country.name}&rdquo;? This cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          variant="destructive"
          disabled={deleteMutation.mutation.isPending}
          onClick={() =>
            deleteMutation.mutate(
              { resource: RESOURCE, id: country.id },
              {
                onSuccess: () => { toast.success('Country deleted'); onClose(); },
                onError: () => toast.error('Failed to delete country'),
              },
            )
          }
        >
          {deleteMutation.mutation.isPending ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

type DialogState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; country: CountryDto }
  | { type: 'delete'; country: CountryDto };

export function CountriesTable() {
  const [dialog, setDialog] = useState<DialogState>({ type: 'closed' });
  const closeDialog = () => setDialog({ type: 'closed' });

  const { query, result } = useList<CountryDto>({
    resource: RESOURCE,
    pagination: { mode: 'off' },
  });

  const { data: canCreate } = useCan({ resource: RESOURCE, action: 'create' });
  const { data: canEdit } = useCan({ resource: RESOURCE, action: 'edit' });
  const { data: canDelete } = useCan({ resource: RESOURCE, action: 'delete' });
  const canMutate = canEdit?.can || canDelete?.can;

  const countries = result.data ?? [];

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <AdminList>
        <AdminListFilters className="justify-end">
          {canCreate?.can && (
            <Button size="sm" onClick={() => setDialog({ type: 'create' })}>
              <Plus className="h-4 w-4" />
              Add Country
            </Button>
          )}
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
                  {canMutate && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canMutate ? 6 : 5} className="py-8 text-center text-muted-foreground">
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
                      {canMutate && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="xs" onClick={() => setDialog({ type: 'edit', country: c })}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="destructive" size="xs" onClick={() => setDialog({ type: 'delete', country: c })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
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
                    {canMutate && (
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="xs" onClick={() => setDialog({ type: 'edit', country: c })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="destructive" size="xs" onClick={() => setDialog({ type: 'delete', country: c })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </AdminTableMobile>
        </AdminTableCard>
      </AdminList>

      <Dialog open={dialog.type !== 'closed'} onOpenChange={(open) => !open && closeDialog()}>
        {dialog.type === 'create' && <CountryFormDialog mode="create" onClose={closeDialog} />}
        {dialog.type === 'edit' && <CountryFormDialog mode="edit" country={dialog.country} onClose={closeDialog} />}
        {dialog.type === 'delete' && <DeleteCountryDialog country={dialog.country} onClose={closeDialog} />}
      </Dialog>
    </>
  );
}
