'use client';

import type { FormEvent, ReactNode } from 'react';
import { RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type AdminFilterOption = {
  label: string;
  value: string;
};

type AdminFilterSelect = {
  id: string;
  kind: 'select';
  label: string;
  value: string;
  placeholder: string;
  options: AdminFilterOption[];
  onValueChange: (value: string) => void;
};

type AdminFilterInput = {
  id: string;
  kind: 'input';
  label: string;
  value: string;
  placeholder?: string;
  type?: 'text' | 'date';
  onValueChange: (value: string) => void;
};

export type AdminFilterField = AdminFilterSelect | AdminFilterInput;

type AdminFilterSearch = {
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
};

type AdminFilterBarProps = {
  fields?: AdminFilterField[];
  search?: AdminFilterSearch;
  activeFilterCount?: number;
  actions?: ReactNode;
  className?: string;
  isPending?: boolean;
  onRefresh?: () => void;
  onReset?: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  variant?: 'embedded' | 'panel' | 'plain';
};

export function AdminFilterBar({
  fields = [],
  search,
  activeFilterCount = 0,
  actions,
  className,
  isPending = false,
  onRefresh,
  onReset,
  onSubmit,
  submitLabel = 'Apply',
  variant = 'panel',
}: AdminFilterBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'bg-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center',
        variant === 'panel' && 'rounded-md border',
        variant === 'embedded' && 'border-b px-4 py-3 sm:px-6 sm:py-4',
        variant === 'plain' && 'p-0',
        className,
      )}
      aria-label="Filter results"
    >
      {search ? (
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Label htmlFor={`${search.label}-search`} className="sr-only">
            {search.label}
          </Label>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden={true}
          />
          <Input
            id={`${search.label}-search`}
            className="pl-9"
            placeholder={search.placeholder}
            value={search.value}
            onChange={(event) => search.onValueChange(event.target.value)}
          />
        </div>
      ) : (
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <SlidersHorizontal size={16} aria-hidden={true} />
          <span>Filters</span>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:justify-end">
        {fields.map((field) => (
          <div key={field.id} className="min-w-36 flex-1 sm:max-w-48 sm:flex-none">
            <Label htmlFor={field.id} className="sr-only">
              {field.label}
            </Label>
            {field.kind === 'select' ? (
              <Select value={field.value} onValueChange={field.onValueChange}>
                <SelectTrigger id={field.id} aria-label={field.label} className="w-full">
                  <SelectValue placeholder={field.placeholder}>
                    {(value) =>
                      field.options.find((option) => option.value === value)?.label ??
                      field.placeholder
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={field.id}
                type={field.type ?? 'text'}
                aria-label={field.label}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(event) => field.onValueChange(event.target.value)}
              />
            )}
          </div>
        ))}

        {activeFilterCount > 0 ? (
          <Badge variant="secondary" className="h-6 min-w-6 justify-center rounded-full px-1.5">
            {activeFilterCount}
          </Badge>
        ) : null}

        {onReset && activeFilterCount > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            <X size={16} aria-hidden={true} />
            Reset
          </Button>
        ) : null}

        {onRefresh ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isPending}
            aria-label="Refresh data"
            title="Refresh data"
          >
            <RefreshCw size={16} className={cn(isPending && 'animate-spin')} aria-hidden={true} />
          </Button>
        ) : null}

        {onSubmit ? (
          <Button type="submit" size="sm" disabled={isPending}>
            {submitLabel}
          </Button>
        ) : null}

        {actions}
      </div>
    </form>
  );
}
