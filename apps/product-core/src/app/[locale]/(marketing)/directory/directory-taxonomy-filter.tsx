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
    <div className="mt-8 space-y-3 border border-border bg-surface p-3">
      <div className="space-y-2">
        <Label htmlFor="directory-sphere" className="text-xs font-medium uppercase text-muted">
          Sphere
        </Label>
        <select
          id="directory-sphere"
          value={sphereSlug}
          onChange={(event) => handleSphereChange(event.target.value)}
          className="h-11 w-full border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="">Select sphere</option>
          {categoryTree.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {sphereSlug && (
        <div className="space-y-2">
          <Label htmlFor="directory-category" className="text-xs font-medium uppercase text-muted">
            Category
          </Label>
          <select
            id="directory-category"
            value={categorySlug}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className="h-11 w-full border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">Select category</option>
            {categoryOptions.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {sphereSlug && categorySlug && (
        <div className="space-y-2">
          <Label htmlFor="directory-activity" className="text-xs font-medium uppercase text-muted">
            Activity Type
          </Label>
          <select
            id="directory-activity"
            value={activitySlug}
            onChange={(event) => handleActivityChange(event.target.value)}
            className="h-11 w-full border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">Select activity type</option>
            {activityOptions.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {hasSelection && (
        <div className="pt-1">
          <Link
            href={`/${locale}/directory`}
            className={getButtonClasses({ color: 'secondary', size: 'sm' })}
          >
            Reset
          </Link>
        </div>
      )}
    </div>
  );
}
