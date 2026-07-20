'use client';

import { useState } from 'react';
import { ArrowUp, Star, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminBusinessListItemDto, StaffRole } from '@kclub/contracts';

const FEATURED_TOP_MAX = 3;
const FEATURED_RECOMMENDED_MAX = 3;

function canToggleFeatured(role: StaffRole): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'MODERATOR';
}

async function updateFeatured(
  businessId: string,
  payload: { featuredTop?: boolean; featuredRecommended?: boolean },
) {
  const res = await fetch(`/api/proxy/businesses/${businessId}/featured`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    const code = body?.error?.code ?? '';
    const message = body?.error?.message ?? 'Conflict';
    return { ok: false, error: code || message };
  }

  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
}

type CatalogListProps = {
  businesses: AdminBusinessListItemDto[];
  staffRole: StaffRole;
};

export function CatalogList({ businesses: initialBusinesses, staffRole }: CatalogListProps) {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const canToggle = canToggleFeatured(staffRole);

  const featuredTopCount = businesses.filter((b) => b.featuredTop).length;
  const featuredRecommendedCount = businesses.filter((b) => b.featuredRecommended).length;

  async function handleToggle(
    businessId: string,
    field: 'featuredTop' | 'featuredRecommended',
    currentValue: boolean,
  ) {
    if (!canToggle) return;
    const newValue = !currentValue;
    const payload =
      field === 'featuredTop' ? { featuredTop: newValue } : { featuredRecommended: newValue };

    setLoadingId(businessId);
    const result = await updateFeatured(businessId, payload);
    setLoadingId(null);

    if (!result.ok) {
      if (result.error === 'FEATURED_LIMIT_REACHED') {
        toast.error(
          `Maximum ${field === 'featuredTop' ? 'featured top' : 'featured recommended'} (3) already reached.`,
        );
      } else if (result.error === 'FEATURED_BUSINESS_NOT_PUBLISHED') {
        toast.error('Only PUBLISHED businesses can be featured.');
      } else {
        toast.error(result.error ?? 'Failed to update featured flag');
      }
      return;
    }

    setBusinesses((prev) =>
      prev.map((b) => (b.id === businessId ? { ...b, [field]: newValue } : b)),
    );
    toast.success(
      field === 'featuredTop'
        ? `Featured top ${newValue ? 'enabled' : 'disabled'}`
        : `Featured recommended ${newValue ? 'enabled' : 'disabled'}`,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUp className="h-4 w-4" />
              Featured Top
            </CardTitle>
            <CardDescription>Homepage featured spotlight</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {featuredTopCount}
              <span className="text-muted-foreground">/{FEATURED_TOP_MAX}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4" />
              Featured Recommended
            </CardTitle>
            <CardDescription>Recommended section placement</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {featuredRecommendedCount}
              <span className="text-muted-foreground">/{FEATURED_RECOMMENDED_MAX}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Featured Top</TableHead>
                <TableHead className="text-center">Featured Recommended</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No businesses found
                  </TableCell>
                </TableRow>
              ) : (
                businesses.map((b) => {
                  const isPublished = b.status === 'PUBLISHED';
                  const isLoading = loadingId === b.id;

                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div>
                          <span className="text-sm font-medium">{b.name}</span>
                          {b.categoryName && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {b.categoryName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={b.featuredTop ? 'default' : 'outline'}
                          size="sm"
                          disabled={!canToggle || !isPublished || isLoading}
                          onClick={() => handleToggle(b.id, 'featuredTop', b.featuredTop)}
                        >
                          {b.featuredTop ? 'On' : 'Off'}
                        </Button>
                        {b.featuredTop && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {featuredTopCount}/{FEATURED_TOP_MAX}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={b.featuredRecommended ? 'default' : 'outline'}
                          size="sm"
                          disabled={!canToggle || !isPublished || isLoading}
                          onClick={() =>
                            handleToggle(b.id, 'featuredRecommended', b.featuredRecommended)
                          }
                        >
                          {b.featuredRecommended ? 'On' : 'Off'}
                        </Button>
                        {b.featuredRecommended && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {featuredRecommendedCount}/{FEATURED_RECOMMENDED_MAX}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y md:hidden">
          {businesses.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No businesses found
            </div>
          ) : (
            businesses.map((b) => {
              const isPublished = b.status === 'PUBLISHED';
              const isLoading = loadingId === b.id;

              return (
                <div key={b.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.categoryName}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <Button
                        variant={b.featuredTop ? 'default' : 'outline'}
                        size="sm"
                        disabled={!canToggle || !isPublished || isLoading}
                        onClick={() => handleToggle(b.id, 'featuredTop', b.featuredTop)}
                      >
                        {b.featuredTop ? 'On' : 'Off'}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-muted-foreground" />
                      <Button
                        variant={b.featuredRecommended ? 'default' : 'outline'}
                        size="sm"
                        disabled={!canToggle || !isPublished || isLoading}
                        onClick={() =>
                          handleToggle(b.id, 'featuredRecommended', b.featuredRecommended)
                        }
                      >
                        {b.featuredRecommended ? 'On' : 'Off'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {(!canToggle || businesses.some((b) => b.status !== 'PUBLISHED')) && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Only PUBLISHED businesses can be featured. Featured slots are limited to 3 per type.
          </span>
        </div>
      )}
    </div>
  );
}
