import Link from 'next/link';
import { Lock } from 'lucide-react';

import type { Locale } from '@/i18n/routing';

import { cabinetLockedStateClasses } from './styles';

type CabinetLockedPanelProps = {
  locale: Locale;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
};

export function CabinetLockedPanel({
  locale,
  eyebrow,
  title,
  description,
  ctaLabel,
}: CabinetLockedPanelProps) {
  return (
    <div className={cabinetLockedStateClasses}>
      <div className="mb-6 flex h-16 w-16 items-center justify-center border border-border bg-surface-muted">
        <Lock size={24} className="text-muted" aria-hidden />
      </div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mb-3 text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      <Link
        href={`/${locale}/m/dashboard?tab=billing`}
        className="inline-flex items-center gap-2 bg-accent px-7 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
