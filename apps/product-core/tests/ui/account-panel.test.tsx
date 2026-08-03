import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import type { CurrentMemberProfileDto } from '@kclub/contracts';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('@/features/member/components/KylyvnykClubCard', () => ({
  KylyvnykClubCard: () => <div data-testid="club-card" />,
}));

import { AccountPanel } from '@/features/member/components/AccountPanel';

const baseProfile: CurrentMemberProfileDto = {
  id: 'member_123',
  phone: '+1234567890',
  displayName: 'Freddie Mercury',
  email: null,
  localePreference: 'en',
  membershipTier: 'MEMBER',
  status: 'ACTIVE',
  onboardingComplete: true,
  termsAcceptedAt: '2026-07-23T10:00:00.000Z',
  createdAt: '2026-07-23T10:00:00.000Z',
  updatedAt: '2026-07-23T10:00:00.000Z',
  country: 'Uzbekistan',
  city: 'Jizzax',
  about: 'About text',
  avatarUrl: null,
};

describe('AccountPanel', () => {
  afterEach(() => {
    cleanup();
  });

  test('marks the VIP upgrade card as the current plan for VIP members', () => {
    render(
      <AccountPanel
        locale="en"
        profile={{ ...baseProfile, membershipTier: 'VIP' }}
        cardNumber="VIP-001"
      />,
    );

    const vipButton = screen.getByRole('button', {
      name: /member\.dashboard\.account\.vipButtonTitle/i,
    });

    expect(vipButton.getAttribute('aria-disabled')).toBe('true');
    expect(vipButton.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByText('member.dashboard.subscription.currentPlanBadge')).toHaveLength(2);
  });

  test('keeps the VIP upgrade card actionable for regular members', () => {
    render(<AccountPanel locale="en" profile={baseProfile} cardNumber="MEM-001" />);

    const vipButton = screen.getByRole('button', {
      name: /member\.dashboard\.account\.vipButtonTitle/i,
    });

    expect(vipButton.getAttribute('aria-disabled')).toBe('false');
    expect(vipButton.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('member.dashboard.account.vipButtonPrice')).toBeTruthy();
  });
});
