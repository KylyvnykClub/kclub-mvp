'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useList, useCreate, useUpdate, useDelete, useCan } from '@refinedev/core';
import { Pencil, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { cityCreateSchema } from '@kclub/validation';
import type { z } from 'zod';
import type { CityDto, CountryDto } from '@kclub/contracts';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const RESOURCE = 'cities';
type CityFormValues = z.input<typeof cityCreateSchema>;

function CityFormDialog({
  mode,
  city,
  countries,
  onClose,
}: {
  mode: 'create' | 'edit';
  city?: CityDto;
  countries: CountryDto[];
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<CityFormValues>({
    resolver: zodResolver(cityCreateSchema),
    defaultValues: {
      countryId: city?.countryId ?? '',
      name: city?.name ?? '',
      slug: city?.slug ?? '',
      isActive: city?.isActive ?? true,
    },
  });

  const createMutation = useCreate<CityDto>();
  const updateMutation = useUpdate<CityDto>();
  const isSaving = createMutation.mutation.isPending || updateMutation.mutation.isPending;

  function onSubmit(values: CityFormValues) {
    if (mode === 'create') {
      createMutation.mutate(
        { resource: RESOURCE, values },
        {
          onSuccess: () => {
            toast.success('City created');
            onClose();
          },
          onError: () => toast.error('Failed to create city'),
        },
      );
    } else {
      updateMutation.mutate(
        { resource: RESOURCE, id: city!.id, values },
        {
          onSuccess: () => {
            toast.success('City updated');
            onClose();
          },
          onError: () => toast.error('Failed to update city'),
        },
      );
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === 'create' ? 'Create City' : 'Edit City'}</DialogTitle>
        <DialogDescription>Enter city details below.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Controller
            name="countryId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="country" className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.countryId && (
            <p className="text-xs text-destructive">{errors.countryId.message}</p>
          )}
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !isValid}>
            {isSaving ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function DeleteCityDialog({ city, onClose }: { city: CityDto; onClose: () => void }) {
  const deleteMutation = useDelete();

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete City</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete &ldquo;{city.name}&rdquo;? This cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={deleteMutation.mutation.isPending}
          onClick={() =>
            deleteMutation.mutate(
              { resource: RESOURCE, id: city.id },
              {
                onSuccess: () => {
                  toast.success('City deleted');
                  onClose();
                },
                onError: () => toast.error('Failed to delete city'),
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
  | { type: 'edit'; city: CityDto }
  | { type: 'delete'; city: CityDto };

export function CitiesTable() {
  const [dialog, setDialog] = useState<DialogState>({ type: 'closed' });
  const closeDialog = () => setDialog({ type: 'closed' });

  const { query, result } = useList<CityDto>({
    resource: RESOURCE,
    pagination: { mode: 'off' },
  });

  const { result: countriesResult } = useList<CountryDto>({
    resource: 'countries',
    pagination: { mode: 'off' },
  });

  const { data: canCreate } = useCan({ resource: RESOURCE, action: 'create' });
  const { data: canEdit } = useCan({ resource: RESOURCE, action: 'edit' });
  const { data: canDelete } = useCan({ resource: RESOURCE, action: 'delete' });
  const canMutate = canEdit?.can || canDelete?.can;

  const cities = result.data ?? [];
  const countries = countriesResult.data ?? [];

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
              Add City
            </Button>
          )}
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
                  {canMutate && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canMutate ? 5 : 4}
                      className="py-8 text-center text-muted-foreground"
                    >
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
                      {canMutate && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => setDialog({ type: 'edit', city })}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="xs"
                              onClick={() => setDialog({ type: 'delete', city })}
                            >
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
                    {canMutate && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setDialog({ type: 'edit', city })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={() => setDialog({ type: 'delete', city })}
                        >
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
        {dialog.type === 'create' && (
          <CityFormDialog mode="create" countries={countries} onClose={closeDialog} />
        )}
        {dialog.type === 'edit' && (
          <CityFormDialog
            mode="edit"
            city={dialog.city}
            countries={countries}
            onClose={closeDialog}
          />
        )}
        {dialog.type === 'delete' && <DeleteCityDialog city={dialog.city} onClose={closeDialog} />}
      </Dialog>
    </>
  );
}
