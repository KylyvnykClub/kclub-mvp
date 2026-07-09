import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

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

import { OnboardingForm } from '@/features/member/components/OnboardingForm';
import type { CurrentMemberProfileDto } from '@kclub/contracts';

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const incompleteProfile: CurrentMemberProfileDto = {
  id: 'member-1',
  phone: '+15551234567',
  displayName: null,
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
    fireEvent.click(screen.getByLabelText('member.onboarding.termsLabel'));
    fireEvent.click(screen.getByText('member.onboarding.submit'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/me/complete-onboarding',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            phone: '+15551234567',
            displayName: 'Ada Member',
            localePreference: 'en',
            termsAccepted: true,
          }),
        }),
      );
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
    fireEvent.click(screen.getByLabelText('member.onboarding.termsLabel'));
    fireEvent.click(screen.getByText('member.onboarding.submit'));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('member.onboarding.errors.invalidInput');
      expect(replace).not.toHaveBeenCalled();
    });
  });
});
