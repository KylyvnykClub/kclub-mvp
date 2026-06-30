'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

export type AdminPaginationProps = {
  page: number;
  total: number;
  limit: number;
  onNavigate: (page: number) => void;
};

export function AdminPagination({ page, total, limit, onNavigate }: AdminPaginationProps) {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
      <span>
        Page {page} of {totalPages} ({total} total)
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onNavigate(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onNavigate(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
