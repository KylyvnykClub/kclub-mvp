import { afterAll, afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as realNextIntl from 'next-intl';

const replace = mock();
const refresh = mock();

mock.module('next/navigation', () => ({
  useRouter: () => ({
    replace,
    refresh,
  }),
}));

mock.module('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

// bun's mock.module() replaces the module registry for the whole test run, not just
// this file, so restore the real implementation once this file's tests are done —
// otherwise later files that render <NextIntlClientProvider> with real messages
// (e.g. about-section.test.tsx) would get this stub instead.
afterAll(() => {
  mock.module('next-intl', () => realNextIntl);
});

import { OnboardingForm } from '@/features/member/components/OnboardingForm';
import { SkipOnboardingButton } from '@/features/member/components/SkipOnboardingButton';
import type { CurrentMemberProfileDto } from '@kclub/contracts';

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const incompleteProfile: CurrentMemberProfileDto = {
  id: 'member-1',
  phone: '+15551234567',
  displayName: null,
  email: null,
  localePreference: null,
  membershipTier: 'MEMBER',
  status: 'ACTIVE',
  onboardingComplete: false,
  termsAcceptedAt: null,
  createdAt: '2026-06-16T00:00:00.000Z',
  updatedAt: '2026-06-16T00:00:00.000Z',
  country: null,
  city: null,
  about: null,
  avatarUrl: null,
};

describe('OnboardingForm', () => {
  afterEach(() => {
    cleanup();
    mockFetch.mockReset();
    replace.mockReset();
    refresh.mockReset();
  });

  test('submits onboarding through the member API and redirects to dashboard', async () => {
    const profile = incompleteProfile;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { ...profile, displayName: 'Ada Member', onboardingComplete: true },
        error: null,
      }),
    } as Response);

    render(<OnboardingForm locale="en" profile={profile} />);

    fireEvent.change(screen.getByLabelText('member.onboarding.displayNameLabel'), {
      target: { value: 'Ada Member' },
    });
    fireEvent.click(screen.getByText('member.onboarding.submit'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/me/complete-onboarding',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            phone: '+15551234567',
            displayName: 'Ada Member',
            email: null,
            localePreference: 'en',
            termsAccepted: true,
          }),
        }),
      );
      expect(replace).toHaveBeenCalledWith('/en/m/dashboard?tab=details');
      expect(refresh).toHaveBeenCalled();
    });
  });

  test('skip button skips onboarding and redirects to dashboard', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { skipped: true }, error: null }),
    } as Response);

    render(<SkipOnboardingButton locale="en" />);

    fireEvent.click(screen.getByTestId('onboarding-skip'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/me/skip-onboarding', { method: 'POST' });
      expect(replace).toHaveBeenCalledWith('/en/m/dashboard?tab=details');
      expect(refresh).toHaveBeenCalled();
    });
  });

  test('shows localized validation error from API envelope', async () => {
    const profile = incompleteProfile;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        data: null,
        error: { code: 'VALIDATION_INVALID_INPUT' },
      }),
    } as Response);

    render(<OnboardingForm locale="en" profile={profile} />);

    fireEvent.change(screen.getByLabelText('member.onboarding.displayNameLabel'), {
      target: { value: 'A' },
    });
    fireEvent.click(screen.getByText('member.onboarding.submit'));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('member.onboarding.errors.invalidInput');
      expect(replace).not.toHaveBeenCalled();
    });
  });
});
