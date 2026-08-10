import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type { MemberIntroductionDto } from '@kclub/contracts';

const api = vi.hoisted(() => ({
  parseAuthResponse: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/features/auth/utils/api', () => ({
  parseAuthResponse: api.parseAuthResponse,
}));

import { IntroductionSubmitForm } from '@/features/member/components/IntroductionSubmitForm';

const introduction: MemberIntroductionDto = {
  id: 'intro-1',
  requesterUserId: 'user-1',
  requesterBusinessId: null,
  targetBusinessId: 'business-1',
  targetBusinessName: 'Business One',
  targetBusinessSlug: 'business-one',
  status: 'SUBMITTED',
  clientName: 'Client Name',
  clientContact: 'clientPhoneLabel: +380501112233',
  message: 'Request details',
  rejectionReason: null,
  createdAt: '2026-08-09T10:00:00.000Z',
  updatedAt: '2026-08-09T10:00:00.000Z',
};

describe('IntroductionSubmitForm', () => {
  afterEach(() => {
    cleanup();
    api.parseAuthResponse.mockReset();
    vi.unstubAllGlobals();
  });

  test('submits the shared contact payload and reports the created recommendation', async () => {
    const onSubmitted = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchMock);
    api.parseAuthResponse.mockResolvedValue({ success: true, data: introduction });

    render(
      <IntroductionSubmitForm
        businessOptions={[{ id: 'business-1', name: 'Business One' }]}
        onSubmitted={onSubmitted}
      />,
    );

    fireEvent.change(screen.getByTestId('intro-target-business'), {
      target: { value: 'business-1' },
    });
    fireEvent.change(screen.getByTestId('intro-client-name'), {
      target: { value: 'Client Name' },
    });
    fireEvent.change(screen.getByTestId('intro-client-phone'), {
      target: { value: '+380501112233' },
    });
    fireEvent.change(screen.getByTestId('intro-message'), {
      target: { value: 'Request details' },
    });
    fireEvent.click(screen.getByTestId('intro-submit'));

    await waitFor(() => {
      expect(onSubmitted).toHaveBeenCalledWith(introduction);
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      targetBusinessId: 'business-1',
      clientName: 'Client Name',
      clientContact: 'clientPhoneLabel: +380501112233',
      message: 'Request details',
    });
    expect(screen.getByTestId('intro-submit-success')).toBeTruthy();
  });
});
