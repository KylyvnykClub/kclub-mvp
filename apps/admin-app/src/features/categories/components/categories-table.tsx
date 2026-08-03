'use client';

import { useMemo, useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCan, useCreate, useDelete, useList, useUpdate } from '@refinedev/core';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { z } from 'zod';

import type { CategoryDto, CategoryLevel } from '@kclub/contracts';
import { categoryCreateSchema } from '@kclub/validation';

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

const RESOURCE = 'categories';
const CATEGORY_LEVELS: CategoryLevel[] = ['BLOCK', 'CATEGORY', 'SUBCATEGORY'];

type CategoryFormValues = z.input<typeof categoryCreateSchema>;
type CreateDefaults = Partial<
  Pick<CategoryFormValues, 'level' | 'parentId' | 'sortOrder' | 'isActive' | 'isCustom'>
>;

type DialogState =
  | { type: 'closed' }
  | { type: 'create'; defaults?: CreateDefaults }
  | { type: 'edit'; category: CategoryDto }
  | { type: 'delete'; category: CategoryDto };

function CategoryFormDialog({
  mode,
  category,
  categories,
  defaults,
  onClose,
}: {
  mode: 'create' | 'edit';
  category?: CategoryDto;
  categories: CategoryDto[];
  defaults?: CreateDefaults | undefined;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryCreateSchema),
    mode: 'onChange',
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      parentId: category?.parentId ?? defaults?.parentId ?? null,
      level: category?.level ?? defaults?.level ?? 'CATEGORY',
      sortOrder: category?.sortOrder ?? defaults?.sortOrder ?? 0,
      isHighRisk: category?.isHighRisk ?? false,
      isActive: category?.isActive ?? defaults?.isActive ?? true,
      isCustom: category?.isCustom ?? defaults?.isCustom ?? false,
    },
  });
  const [selectedLevel, setSelectedLevel] = useState<CategoryLevel>(
    category?.level ?? defaults?.level ?? 'CATEGORY',
  );
  const [selectedParentId, setSelectedParentId] = useState<string>(
    category?.parentId ?? defaults?.parentId ?? '',
  );

  const parentOptions = getParentOptions(categories, selectedLevel, category?.id);
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
      return;
    }

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

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === 'create' ? 'Create Category' : 'Edit Category'}</DialogTitle>
        <DialogDescription>
          Manage the block, category, and subcategory structure.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <Select
              value={selectedLevel}
              onValueChange={(value) => {
                const nextLevel = value as CategoryLevel;
                const nextParentId = nextLevel === 'BLOCK' ? '' : '';
                setSelectedLevel(nextLevel);
                setSelectedParentId(nextParentId);
                setValue('level', nextLevel, { shouldValidate: true });
                setValue('parentId', nextLevel === 'BLOCK' ? null : nextParentId, {
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger id="level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Parent</Label>
            <Select
              value={selectedParentId}
              disabled={selectedLevel === 'BLOCK'}
              onValueChange={(value) => {
                setSelectedParentId(value);
                setValue('parentId', value || null, { shouldValidate: true });
              }}
            >
              <SelectTrigger id="parentId">
                <SelectValue placeholder={selectedLevel === 'BLOCK' ? 'None' : 'Select parent'} />
              </SelectTrigger>
              <SelectContent>
                {parentOptions.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.parentId && (
              <p className="text-xs text-destructive">{errors.parentId.message}</p>
            )}
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

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            type="number"
            min={0}
            {...register('sortOrder', { valueAsNumber: true })}
          />
          {errors.sortOrder && (
            <p className="text-xs text-destructive">{errors.sortOrder.message}</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <CheckboxField id="isHighRisk" label="High Risk" register={register('isHighRisk')} />
          <CheckboxField id="isActive" label="Active" register={register('isActive')} />
          <CheckboxField id="isCustom" label="Custom" register={register('isCustom')} />
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

function CheckboxField({
  id,
  label,
  register,
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm">
      <input id={id} type="checkbox" className="h-4 w-4 rounded border-input" {...register} />
      {label}
    </label>
  );
}

function DeactivateCategoryDialog({
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
        <DialogTitle>Deactivate Category</DialogTitle>
        <DialogDescription>
          &ldquo;{category.name}&rdquo; will be hidden from filters and forms, while existing
          business links stay intact.
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
                  toast.success('Category deactivated');
                  onClose();
                },
                onError: () => toast.error('Failed to deactivate category'),
              },
            )
          }
        >
          {deleteMutation.mutation.isPending ? 'Deactivating...' : 'Deactivate'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CategoryRow({
  cat,
  parentName,
  canCreate,
  canMutate,
  onAddChild,
  onEdit,
  onDelete,
}: {
  cat: CategoryDto;
  parentName: string;
  canCreate: boolean;
  canMutate: boolean;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const depth = cat.level === 'SUBCATEGORY' ? 'pl-10' : cat.level === 'CATEGORY' ? 'pl-6' : '';

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className={depth}>{cat.name}</div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{cat.level}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{parentName}</TableCell>
      <TableCell className="max-w-xs truncate text-muted-foreground">{cat.slug}</TableCell>
      <TableCell>{cat.sortOrder}</TableCell>
      <TableCell>
        {cat.isCustom ? (
          <Badge variant="outline">Custom</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        {cat.isHighRisk ? (
          <Badge variant="destructive">High Risk</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
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
            {canCreate && cat.level !== 'SUBCATEGORY' && (
              <Button variant="outline" size="xs" onClick={onAddChild}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
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
  parentName,
  canCreate,
  canMutate,
  onAddChild,
  onEdit,
  onDelete,
}: {
  cat: CategoryDto;
  parentName: string;
  canCreate: boolean;
  canMutate: boolean;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{cat.name}</p>
            <Badge variant="outline">{cat.level}</Badge>
            {cat.isCustom && <Badge variant="outline">Custom</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{cat.slug}</p>
          <p className="mt-1 text-xs text-muted-foreground">Parent: {parentName}</p>
        </div>
        <Badge variant={cat.isActive ? 'default' : 'secondary'}>
          {cat.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>{cat.isHighRisk && <Badge variant="destructive">High Risk</Badge>}</div>
        {canMutate && (
          <div className="flex items-center gap-1">
            {canCreate && cat.level !== 'SUBCATEGORY' && (
              <Button variant="outline" size="xs" onClick={onAddChild}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
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
  const categories = useMemo(() => result.data ?? [], [result.data]);
  const orderedCategories = useMemo(() => orderCategories(categories), [categories]);
  const parentNames = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);
  const canCreateCategory = !!canCreate?.can;
  const canMutate = !!(canEdit?.can || canDelete?.can);

  function openChildDialog(parent: CategoryDto): void {
    setDialog({
      type: 'create',
      defaults: {
        parentId: parent.id,
        level: parent.level === 'BLOCK' ? 'CATEGORY' : 'SUBCATEGORY',
        sortOrder: 0,
      },
    });
  }

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
          {canCreateCategory && (
            <Button
              size="sm"
              onClick={() =>
                setDialog({
                  type: 'create',
                  defaults: { level: 'BLOCK', parentId: null, sortOrder: 0 },
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add Block
            </Button>
          )}
        </AdminListFilters>

        <AdminTableCard>
          <AdminTableDesktop>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  {canMutate && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  orderedCategories.map((cat) => (
                    <CategoryRow
                      key={cat.id}
                      cat={cat}
                      parentName={cat.parentId ? (parentNames.get(cat.parentId) ?? '-') : '-'}
                      canCreate={canCreateCategory}
                      canMutate={canMutate}
                      onAddChild={() => openChildDialog(cat)}
                      onEdit={() => setDialog({ type: 'edit', category: cat })}
                      onDelete={() => setDialog({ type: 'delete', category: cat })}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </AdminTableDesktop>

          <AdminTableMobile>
            {orderedCategories.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No categories found
              </div>
            ) : (
              orderedCategories.map((cat) => (
                <CategoryMobileCard
                  key={cat.id}
                  cat={cat}
                  parentName={cat.parentId ? (parentNames.get(cat.parentId) ?? '-') : '-'}
                  canCreate={canCreateCategory}
                  canMutate={canMutate}
                  onAddChild={() => openChildDialog(cat)}
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
          <CategoryFormDialog
            mode="create"
            categories={categories}
            defaults={dialog.defaults}
            onClose={closeDialog}
          />
        )}
        {dialog.type === 'edit' && (
          <CategoryFormDialog
            mode="edit"
            category={dialog.category}
            categories={categories}
            onClose={closeDialog}
          />
        )}
        {dialog.type === 'delete' && (
          <DeactivateCategoryDialog category={dialog.category} onClose={closeDialog} />
        )}
      </Dialog>
    </>
  );
}

function getParentOptions(
  categories: CategoryDto[],
  level: CategoryLevel,
  currentCategoryId?: string,
): CategoryDto[] {
  if (level === 'BLOCK') return [];

  const parentLevel: CategoryLevel = level === 'CATEGORY' ? 'BLOCK' : 'CATEGORY';
  return categories
    .filter((category) => {
      return (
        category.level === parentLevel && category.id !== currentCategoryId && category.isActive
      );
    })
    .sort(compareCategories);
}

function orderCategories(categories: CategoryDto[]): CategoryDto[] {
  const blocks = categories
    .filter((category) => category.level === 'BLOCK')
    .sort(compareCategories);
  const byParentId = new Map<string, CategoryDto[]>();
  const loose = categories.filter((category) => category.level !== 'BLOCK' && !category.parentId);

  for (const category of categories) {
    if (!category.parentId) continue;
    const items = byParentId.get(category.parentId) ?? [];
    items.push(category);
    byParentId.set(category.parentId, items);
  }

  const ordered: CategoryDto[] = [];
  for (const block of blocks) {
    ordered.push(block);
    const childCategories = (byParentId.get(block.id) ?? []).sort(compareCategories);
    for (const category of childCategories) {
      ordered.push(category);
      ordered.push(...(byParentId.get(category.id) ?? []).sort(compareCategories));
    }
  }

  return [...ordered, ...loose.sort(compareCategories)];
}

function compareCategories(left: CategoryDto, right: CategoryDto): number {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
}
