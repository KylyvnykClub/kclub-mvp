'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

import { cn } from '@kclub/ui';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Locale, locales, stripLocalePrefix } from '@/i18n/routing';

export type LocaleSwitcherVariant = 'topbar-menu' | 'topbar-mobile' | 'footer' | 'account-menu';

type LocaleSwitcherLinksProps = {
  locale: Locale;
  onSelect?: () => void;
  variant: LocaleSwitcherVariant;
};

function getItemClassName(variant: LocaleSwitcherVariant, isActive: boolean): string {
  switch (variant) {
    case 'account-menu':
      return cn(
        'dark:text-white/72 flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent dark:hover:bg-white/[0.08] dark:hover:text-white dark:focus-visible:ring-white',
        isActive ? 'font-semibold text-zinc-950 dark:text-white' : 'text-zinc-700',
      );
    case 'topbar-menu':
      return cn(
        'block px-4 py-3 text-sm normal-case transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset dark:focus-visible:ring-accent',
        isActive
          ? 'font-semibold text-zinc-950 dark:text-white'
          : 'dark:text-white/68 text-zinc-500',
      );
    case 'topbar-mobile':
      return cn(
        'border px-4 py-3 text-sm transition hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:hover:bg-white/[0.06] dark:focus-visible:ring-white',
        isActive
          ? 'border-zinc-950 text-zinc-950 dark:border-white dark:text-white'
          : 'dark:text-white/68 border-zinc-200 text-zinc-500 dark:border-white/10',
      );
    case 'footer':
      return 'dark:text-white/68 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:hover:text-white dark:focus-visible:ring-white';
  }
}

export function LocaleSwitcherLinks({
  locale,
  onSelect,
  variant,
}: LocaleSwitcherLinksProps): ReactElement {
  const pathname = stripLocalePrefix(usePathname());
  const t = useTranslations('home');
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleSelect = (item: Locale) => {
    startTransition(() => {
      router.replace(pathname, { locale: item });
    });
    onSelect?.();
  };

  if (variant === 'footer') {
    return (
      <ul className="mt-5 grid gap-3">
        {locales.map((item) => (
          <li key={item}>
            <button
              key={item}
              type="button"
              onClick={() => handleSelect(item)}
              className={getItemClassName(variant, item === locale)}
            >
              {t(`locale.${item}`)}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      {locales.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => handleSelect(item)}
          className={getItemClassName(variant, item === locale)}
        >
          {t(`locale.${item}`)}
        </button>
      ))}
    </>
  );
}
