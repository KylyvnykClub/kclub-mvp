import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const theme = vi.hoisted(() => ({
  resolvedTheme: undefined as string | undefined,
  setTheme: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next-themes', () => ({
  useTheme: () => theme,
}));

import { ThemeToggle } from '@/features/marketing/components/ThemeToggle';

describe('ThemeToggle', () => {
  afterEach(() => {
    cleanup();
    theme.resolvedTheme = undefined;
    theme.setTheme.mockReset();
  });

  test('renders stable icon markup before and after theme resolution', () => {
    const { container, rerender } = render(<ThemeToggle />);
    const initialMarkup = container.innerHTML;

    theme.resolvedTheme = 'dark';
    rerender(<ThemeToggle />);

    expect(container.innerHTML).toBe(initialMarkup);
    expect(container.querySelector('.lucide-sun')).toBeTruthy();
    expect(container.querySelector('.lucide-moon')).toBeTruthy();
  });

  test('toggles from the resolved theme', () => {
    theme.resolvedTheme = 'dark';
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole('button', { name: 'common.toggleTheme' }));

    expect(theme.setTheme).toHaveBeenCalledWith('light');
  });
});
