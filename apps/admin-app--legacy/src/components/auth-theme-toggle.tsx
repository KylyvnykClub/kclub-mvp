'use client';

import { ThemeToggle } from '@/components/theme-toggle';

export function AuthThemeToggle() {
  return (
    <div className="fixed right-4 top-4 z-50">
      <ThemeToggle />
    </div>
  );
}
