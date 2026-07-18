import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

// vi.mock is hoisted above the imports, so shared state must be hoisted too
const nav = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockRefresh: vi.fn(),
  mockPathname: '/en',
}));
const { mockReplace, mockRefresh } = nav;

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return {
    ...actual,
    usePathname: () => nav.mockPathname,
    useRouter: () => ({
      replace: nav.mockReplace,
      refresh: nav.mockRefresh,
    }),
  };
});

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: vi.fn(),
  }),
}));

import { TopBar } from '@/features/marketing/components/TopBar';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('TopBar', () => {
  afterEach(() => {
    cleanup();
    mockFetch.mockReset();
    mockReplace.mockReset();
    mockRefresh.mockReset();
    nav.mockPathname = '/en';
  });

  test('renders partners directory nav and guest account actions', () => {
    render(<TopBar locale="en" />);

    const partnersLink = screen.getByText('home.nav.partners').closest('a');
    const desktopNav = partnersLink?.closest('nav');

    expect(screen.queryByText('home.nav.catalog')).toBeNull();
    expect(partnersLink?.getAttribute('href')).toBe('/en/directory');
    expect(desktopNav?.className).toContain('hidden');
    expect(desktopNav?.className).toContain('md:flex');
    expect(desktopNav?.className).toContain('text-[11px]');
    expect(partnersLink?.className).toContain('whitespace-nowrap');
    expect(screen.getByLabelText('home.common.menu').className).toContain('h-11');
    expect(screen.queryByText('home.nav.cabinet')).toBeNull();

    fireEvent.click(screen.getByLabelText('home.nav.account'));

    expect(screen.getByText('home.nav.signIn')).toBeTruthy();
    expect(screen.getByText('home.nav.join')).toBeTruthy();
  });

  test('renders authenticated account actions without cabinet top-level nav', () => {
    render(<TopBar locale="en" isAuthenticated />);

    const partnersLink = screen.getByText('home.nav.partners').closest('a');

    expect(screen.queryByText('home.nav.catalog')).toBeNull();
    expect(partnersLink?.getAttribute('href')).toBe('/en/directory');
    expect(screen.queryByText('home.nav.cabinet')).toBeNull();

    fireEvent.click(screen.getByLabelText('home.nav.account'));

    expect(screen.getByText('home.nav.dashboard')).toBeTruthy();
    expect(screen.getByText('home.nav.signOut')).toBeTruthy();
  });

  test('shows authenticated account actions after client navigation into member dashboard', () => {
    nav.mockPathname = '/en/m/dashboard';

    render(<TopBar locale="en" />);

    fireEvent.click(screen.getByLabelText('home.nav.account'));

    expect(screen.getByText('home.nav.dashboard')).toBeTruthy();
    expect(screen.getByText('home.nav.signOut')).toBeTruthy();
    expect(screen.queryByText('home.nav.signIn')).toBeNull();
    expect(screen.queryByText('home.nav.join')).toBeNull();
  });

  test('sign-out posts logout and redirects to localized sign-in', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null, error: null }),
    } as Response);

    render(<TopBar locale="en" isAuthenticated />);

    fireEvent.click(screen.getByLabelText('home.nav.account'));
    fireEvent.click(screen.getByText('home.nav.signOut'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/logout', { method: 'POST' });
      expect(mockReplace).toHaveBeenCalledWith('/en/sign-in');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
