'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const t = useTranslations('home');
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={t('common.toggleTheme')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`kclub-toggle-button ${className}`}
    >
      {isDark ? (
        <Sun aria-hidden="true" size={18} strokeWidth={1.5} />
      ) : (
        <Moon aria-hidden="true" size={18} strokeWidth={1.5} />
      )}
    </button>
  );
}
