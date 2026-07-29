'use client';

import type { CountryCode } from '@kclub/ui';
import type { Locale } from '@/i18n/routing';

function emojiFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function CountryFlagIcon({ code }: { code: CountryCode }) {
  return <span aria-hidden="true">{emojiFlag(code)}</span>;
}

export function renderCountryFlag(code: CountryCode) {
  return <CountryFlagIcon code={code} />;
}

const LOCALE_DEFAULT_COUNTRY: Record<Locale, CountryCode> = {
  en: 'US',
  ru: 'RU',
  uk: 'UA',
};

export function defaultCountryForLocale(locale: Locale): CountryCode {
  return LOCALE_DEFAULT_COUNTRY[locale] ?? 'US';
}

export const kclubPhoneTriggerClassName =
  'flex shrink-0 items-center gap-1.5 border border-border bg-surface px-3 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-surface-muted';

export const kclubPhonePanelClassName =
  'border-border bg-surface text-foreground shadow-2xl dark:bg-surface-muted';

export const shadcnPhoneInputClassName =
  'h-8 w-full min-w-0 border border-input bg-transparent px-2.5 py-1 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30';

export const shadcnPhoneTriggerClassName =
  'flex h-8 shrink-0 items-center gap-1.5 border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30';

export const shadcnPhonePanelClassName =
  'border-border bg-popover text-popover-foreground shadow-md';
