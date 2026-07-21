'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useList, useCreate, useUpdate, useDelete, useCan } from '@refinedev/core';
import { Pencil, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { categoryCreateSchema } from '@kclub/validation';
import type { z } from 'zod';

type CategoryFormValues = z.input<typeof categoryCreateSchema>;
import type { CategoryDto } from '@kclub/contracts';

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

const RESOURCE = 'categories';

function CategoryFormDialog({
  mode,
  category,
  onClose,
}: {
  mode: 'create' | 'edit';
  category?: CategoryDto;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      isHighRisk: category?.isHighRisk ?? false,
      isActive: category?.isActive ?? true,
      isCustom: category?.isCustom ?? false,
    },
  });

  const createMutation = useCreate<CategoryDto>();
  const updateMutation = useUpdate<CategoryDto>();
  const isSaving = createMutation.mutation.isPending || updateMutation.mutation.isPending;

  function onSubmit(values: CategoryFormValues) {
    if (mode === 'create') {
      createMutation.mutate(
        { resource: RESOURCE, values },
        {
          onSuccess: () => {
            toast.success('Category created');
            onClose();
          },
          onError: () => toast.error('Failed to create category'),
        },
      );
    } else {
      updateMutation.mutate(
        { resource: RESOURCE, id: category!.id, values },
        {
          onSuccess: () => {
            toast.success('Category updated');
            onClose();
          },
          onError: () => toast.error('Failed to update category'),
        },
      );
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === 'create' ? 'Create Category' : 'Edit Category'}</DialogTitle>
        <DialogDescription>Enter category details below.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            id="isHighRisk"
            type="checkbox"
            {...register('isHighRisk')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isHighRisk">High Risk</Label>
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
        <div className="flex items-center gap-2">
          <input
            id="isCustom"
            type="checkbox"
            {...register('isCustom')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isCustom">Custom (user-submitted)</Label>
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

function DeleteCategoryDialog({
  category,
  onClose,
}: {
  category: CategoryDto;
  onClose: () => void;
}) {
  const deleteMutation = useDelete();

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete &ldquo;{category.name}&rdquo;? This cannot be undone.
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
              { resource: RESOURCE, id: category.id },
              {
                onSuccess: () => {
                  toast.success('Category deleted');
                  onClose();
                },
                onError: () => toast.error('Failed to delete category'),
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
  | { type: 'edit'; category: CategoryDto }
  | { type: 'delete'; category: CategoryDto };

function CategoryRow({
  cat,
  canMutate,
  onEdit,
  onDelete,
}: {
  cat: CategoryDto;
  canMutate: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{cat.name}</TableCell>
      <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
      <TableCell>
        {cat.isCustom ? (
          <Badge variant="outline">Custom</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {cat.isHighRisk ? (
          <Badge variant="destructive">High Risk</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={cat.isActive ? 'default' : 'secondary'}>
          {cat.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      {canMutate && (
        <TableCell>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="xs" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="destructive" size="xs" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

function CategoryMobileCard({
  cat,
  canMutate,
  onEdit,
  onDelete,
}: {
  cat: CategoryDto;
  canMutate: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {cat.name}
            {cat.isCustom && (
              <Badge variant="outline" className="ml-2">
                Custom
              </Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{cat.slug}</p>
        </div>
        <Badge variant={cat.isActive ? 'default' : 'secondary'}>
          {cat.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>{cat.isHighRisk && <Badge variant="destructive">High Risk</Badge>}</div>
        {canMutate && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="xs" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="destructive" size="xs" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CategoriesTable() {
  const [dialog, setDialog] = useState<DialogState>({ type: 'closed' });
  const closeDialog = () => setDialog({ type: 'closed' });

  const { query, result } = useList<CategoryDto>({
    resource: RESOURCE,
    pagination: { mode: 'off' },
  });

  const { data: canCreate } = useCan({ resource: RESOURCE, action: 'create' });
  const { data: canEdit } = useCan({ resource: RESOURCE, action: 'edit' });
  const { data: canDelete } = useCan({ resource: RESOURCE, action: 'delete' });
  const canMutate = canEdit?.can || canDelete?.can;

  const categories = result.data ?? [];

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
              Add Category
            </Button>
          )}
        </AdminListFilters>

        <AdminTableCard>
          <AdminTableDesktop>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  {canMutate && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat) => (
                    <CategoryRow
                      key={cat.id}
                      cat={cat}
                      canMutate={!!canMutate}
                      onEdit={() => setDialog({ type: 'edit', category: cat })}
                      onDelete={() => setDialog({ type: 'delete', category: cat })}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </AdminTableDesktop>

          <AdminTableMobile>
            {categories.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No categories found
              </div>
            ) : (
              categories.map((cat) => (
                <CategoryMobileCard
                  key={cat.id}
                  cat={cat}
                  canMutate={!!canMutate}
                  onEdit={() => setDialog({ type: 'edit', category: cat })}
                  onDelete={() => setDialog({ type: 'delete', category: cat })}
                />
              ))
            )}
          </AdminTableMobile>
        </AdminTableCard>
      </AdminList>

      <Dialog open={dialog.type !== 'closed'} onOpenChange={(open) => !open && closeDialog()}>
        {dialog.type === 'create' && (
          <CategoryFormDialog mode="create" onClose={closeDialog} />
        )}
        {dialog.type === 'edit' && (
          <CategoryFormDialog mode="edit" category={dialog.category} onClose={closeDialog} />
        )}
        {dialog.type === 'delete' && (
          <DeleteCategoryDialog category={dialog.category} onClose={closeDialog} />
        )}
      </Dialog>
    </>
  );
}
