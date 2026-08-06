import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import type { CurrentMemberProfileDto, UserContext } from '@kclub/contracts';

import { MemberCabinetShell } from '@/features/member/components/cabinet/MemberCabinetShell';
import type { ImplementedMemberDashboardTab } from '@/features/member/dashboard-tabs';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

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
  country: 'Austria',
  city: 'Gosdorf',
  about: null,
  avatarUrl: null,
};

const memberContext: UserContext = {
  isVip: false,
  hasBusiness: false,
  businessPublished: false,
};

const tabLabels: Record<ImplementedMemberDashboardTab, string> = {
  details: 'Account',
  business: 'Business',
  recommendations: 'Incoming Recommendations',
  introductions: 'Introductions',
  settings: 'Settings',
};

function renderShell(profile: CurrentMemberProfileDto, userContext: UserContext) {
  return render(
    <MemberCabinetShell
      locale="en"
      profile={profile}
      userContext={userContext}
      activeTab="details"
      visibleTabs={['details', 'settings']}
      tabLabels={tabLabels}
      contactLine={profile.phone}
      tabsAriaLabel="Dashboard tabs"
      lockLabels={{ VIP: 'VIP', BIZ: 'BIZ' }}
      onTabChange={vi.fn()}
    >
      <div>Account content</div>
    </MemberCabinetShell>,
  );
}

describe('MemberCabinetShell', () => {
  afterEach(() => {
    cleanup();
  });

  test('shows a compact VIP marker on account tabs for VIP members', () => {
    renderShell({ ...baseProfile, membershipTier: 'VIP' }, { ...memberContext, isVip: true });

    expect(screen.getAllByLabelText('VIP')).toHaveLength(2);
  });

  test('does not show the VIP marker on account tabs for regular members', () => {
    renderShell(baseProfile, memberContext);

    expect(screen.queryByLabelText('VIP')).toBeNull();
  });
});
