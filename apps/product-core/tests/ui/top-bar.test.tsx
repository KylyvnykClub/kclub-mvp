import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockReplace = mock();
const mockRefresh = mock();

mock.module('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

mock.module('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

mock.module('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: mock(),
  }),
}));

import { TopBar } from '@/features/marketing/components/TopBar';

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('TopBar', () => {
  afterEach(() => {
    cleanup();
    mockFetch.mockReset();
    mockReplace.mockReset();
    mockRefresh.mockReset();
  });

  test('renders catalog nav and guest account actions', () => {
    render(<TopBar locale="en" />);

    expect(screen.getAllByText('home.nav.catalog').length).toBeGreaterThan(0);
    expect(screen.queryByText('home.nav.cabinet')).toBeNull();

    fireEvent.click(screen.getByLabelText('home.nav.account'));

    expect(screen.getByText('home.nav.signIn')).toBeTruthy();
    expect(screen.getByText('home.nav.join')).toBeTruthy();
  });

  test('renders authenticated account actions without cabinet top-level nav', () => {
    render(<TopBar locale="en" isAuthenticated />);

    expect(screen.getAllByText('home.nav.catalog').length).toBeGreaterThan(0);
    expect(screen.queryByText('home.nav.cabinet')).toBeNull();

    fireEvent.click(screen.getByLabelText('home.nav.account'));

    expect(screen.getByText('home.nav.dashboard')).toBeTruthy();
    expect(screen.getByText('home.nav.signOut')).toBeTruthy();
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
