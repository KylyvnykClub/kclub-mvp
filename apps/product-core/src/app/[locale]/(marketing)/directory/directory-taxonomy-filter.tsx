'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { CategoryDto } from '@kclub/contracts';
import { getButtonClasses } from '@kclub/ui';

import { Label } from '@/components/ui/label';
import type { Locale } from '@/i18n/routing';

export type CategoryBranch = CategoryDto & {
  categories: Array<CategoryDto & { subcategories: CategoryDto[] }>;
};

type DirectoryTaxonomyFilterProps = {
  locale: Locale;
  categoryTree: CategoryBranch[];
  activeSphere?: string | undefined;
  activeCategory?: string | undefined;
  activeActivity?: string | undefined;
};

export function DirectoryTaxonomyFilter({
  locale,
  categoryTree,
  activeSphere,
  activeCategory,
  activeActivity,
}: DirectoryTaxonomyFilterProps) {
  const router = useRouter();
  const [sphereSlug, setSphereSlug] = useState(activeSphere ?? '');
  const [categorySlug, setCategorySlug] = useState(activeCategory ?? '');
  const [activitySlug, setActivitySlug] = useState(activeActivity ?? '');

  const activeSphereNode = useMemo(() => {
    return categoryTree.find((item) => item.slug === sphereSlug) ?? null;
  }, [categoryTree, sphereSlug]);

  const categoryOptions = activeSphereNode?.categories ?? [];
  const activeCategoryNode = useMemo(() => {
    return categoryOptions.find((item) => item.slug === categorySlug) ?? null;
  }, [categoryOptions, categorySlug]);
  const activityOptions = activeCategoryNode?.subcategories ?? [];
  const hasSelection = sphereSlug || categorySlug || activitySlug;

  function navigate(nextSphere: string, nextCategory: string, nextActivity: string): void {
    const params = new URLSearchParams();
    if (nextSphere) params.set('sphere', nextSphere);
    if (nextCategory) params.set('category', nextCategory);
    if (nextActivity) params.set('activity', nextActivity);

    const query = params.toString();
    router.push(`/${locale}/directory${query ? `?${query}` : ''}`);
  }

  function handleSphereChange(value: string): void {
    setSphereSlug(value);
    setCategorySlug('');
    setActivitySlug('');
    navigate(value, '', '');
  }

  function handleCategoryChange(value: string): void {
    setCategorySlug(value);
    setActivitySlug('');
    navigate(sphereSlug, value, '');
  }

  function handleActivityChange(value: string): void {
    setActivitySlug(value);
    navigate(sphereSlug, categorySlug, value);
  }

  return (
    <div className="mt-8 flex w-full flex-col gap-4 border-b border-accent/20 pb-6 md:flex-row">
      <div className="flex-1">
        <Label htmlFor="directory-sphere" className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Sphere
        </Label>
        <div className="relative">
          <select
            id="directory-sphere"
            value={sphereSlug}
            onChange={(event) => handleSphereChange(event.target.value)}
            className="w-full appearance-none rounded border border-border bg-surface py-3 pl-4 pr-10 text-[15px] text-foreground transition-all focus:border-accent focus:outline-none"
          >
            <option value="">Select sphere</option>
            {categoryTree.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </div>
      </div>

      <div className="flex-1">
        <Label htmlFor="directory-category" className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Category
        </Label>
        <div className="relative">
          <select
            id="directory-category"
            value={categorySlug}
            onChange={(event) => handleCategoryChange(event.target.value)}
            disabled={!sphereSlug}
            className="w-full appearance-none rounded border border-border bg-surface py-3 pl-4 pr-10 text-[15px] text-foreground transition-all focus:border-accent focus:outline-none disabled:opacity-50"
          >
            <option value="">{sphereSlug ? 'Select category' : 'Select sphere first'}</option>
            {categoryOptions.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </div>
      </div>

      <div className="flex-1">
        <Label htmlFor="directory-activity" className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Activity Type
        </Label>
        <div className="relative">
          <select
            id="directory-activity"
            value={activitySlug}
            onChange={(event) => handleActivityChange(event.target.value)}
            disabled={!categorySlug}
            className="w-full appearance-none rounded border border-border bg-surface py-3 pl-4 pr-10 text-[15px] text-foreground transition-all focus:border-accent focus:outline-none disabled:opacity-50"
          >
            <option value="">{categorySlug ? 'Select activity type' : 'Select category first'}</option>
            {activityOptions.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <button className="flex items-center gap-2 rounded border border-border bg-surface px-6 py-3 text-base font-medium text-foreground transition-all hover:border-accent/50 hover:bg-surface-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          More Filters
        </button>
        {hasSelection && (
          <Link
            href={`/${locale}/directory`}
            className="flex h-[50px] items-center justify-center rounded border border-border px-4 text-muted-foreground transition-colors hover:text-foreground"
            title="Reset filters"
          >
            Reset
          </Link>
        )}
      </div>
    </div>
  );
}
