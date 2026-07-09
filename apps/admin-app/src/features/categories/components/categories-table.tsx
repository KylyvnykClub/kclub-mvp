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
import type { CategoryDto } from '@kclub/contracts';

type CategoriesTableProps = {
  categories: CategoryDto[];
};

function CategoryFormDialog({
  mode,
  category,
  onAction,
}: {
  mode: 'create' | 'edit';
  category?: CategoryDto;
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [isHighRisk, setIsHighRisk] = useState(category?.isHighRisk ?? false);
  const [isActive, setIsActive] = useState(category?.isActive ?? true);

  async function handleSubmit() {
    setLoading(true);
    const body = { name, slug, isHighRisk, isActive };
    const url =
      mode === 'create' ? '/api/proxy/categories' : `/api/proxy/categories/${category!.id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(`Failed to ${mode} category`);
      return;
    }
    setOpen(false);
    toast.success(mode === 'create' ? 'Category created' : 'Category updated');
    onAction();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          mode === 'create' ? (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Category
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
          <DialogTitle>{mode === 'create' ? 'Create Category' : 'Edit Category'}</DialogTitle>
          <DialogDescription>Enter category details below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
              id="isHighRisk"
              type="checkbox"
              checked={isHighRisk}
              onChange={(e) => setIsHighRisk(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isHighRisk">High Risk</Label>
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
          <Button disabled={loading || !name.trim() || !slug.trim()} onClick={handleSubmit}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryDialog({
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
          <DialogTitle>Delete Category</DialogTitle>
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
              const res = await fetch(`/api/proxy/categories/${id}`, { method: 'DELETE' });
              setLoading(false);
              if (!res.ok) {
                toast.error('Failed to delete category');
                return;
              }
              setOpen(false);
              toast.success('Category deleted');
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

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const router = useRouter();

  return (
    <AdminList>
      <AdminListFilters className="justify-end">
        <CategoryFormDialog mode="create" onAction={() => router.refresh()} />
      </AdminListFilters>

      <AdminTableCard>
        <AdminTableDesktop>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
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
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CategoryFormDialog
                          mode="edit"
                          category={cat}
                          onAction={() => router.refresh()}
                        />
                        <DeleteCategoryDialog
                          id={cat.id}
                          name={cat.name}
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
          {categories.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No categories found
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.slug}</p>
                  </div>
                  <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div>{cat.isHighRisk && <Badge variant="destructive">High Risk</Badge>}</div>
                  <div className="flex items-center gap-1">
                    <CategoryFormDialog
                      mode="edit"
                      category={cat}
                      onAction={() => router.refresh()}
                    />
                    <DeleteCategoryDialog
                      id={cat.id}
                      name={cat.name}
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
