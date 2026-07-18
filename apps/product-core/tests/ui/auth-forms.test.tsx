import { afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const t = (key: string) => `${namespace}.${key}`;
    t.rich = (key: string, values: Record<string, (chunks: unknown) => unknown>) =>
      Object.entries(values).map(([tag, renderValue]) => (
        <span key={tag}>{renderValue(`${namespace}.${key}.${tag}`) as ReactNode}</span>
      ));
    return t;
  },
}));

import { PasswordRecoveryForm } from '@/features/auth/components/PasswordRecoveryForm';
import { SignInForm } from '@/features/auth/components/SignInForm';
import { SignUpForm } from '@/features/auth/components/SignUpForm';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

function success(data: unknown = null): Response {
  return { ok: true, json: async () => ({ data, error: null }) } as Response;
}

describe('Auth Forms', () => {
  afterEach(() => {
    mockFetch.mockReset();
    mockReplace.mockReset();
  });

  test('sign-in submits phone and password without an OTP request', async () => {
    mockFetch.mockResolvedValueOnce(success({ onboardingComplete: true }));
    render(<SignInForm locale="en" />);

    fireEvent.change(screen.getByLabelText('auth.signIn.phoneLabel'), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText('auth.common.passwordLabel'), {
      target: { value: 'StrongPassword123' },
    });
    fireEvent.click(screen.getByText('auth.signIn.submit'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/sign-in', expect.any(Object));
      expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
        phone: '+1234567890',
        password: 'StrongPassword123',
      });
      expect(screen.queryByLabelText('auth.common.otpLabel')).toBeNull();
      expect(mockReplace).toHaveBeenCalledWith('/en/m/dashboard');
    });
  });

  test('sign-up submits password then transitions to OTP confirmation', async () => {
    mockFetch.mockResolvedValueOnce(success());
    render(<SignUpForm locale="en" />);

    fireEvent.change(screen.getByLabelText('auth.signUp.phoneLabel'), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText('auth.common.passwordLabel'), {
      target: { value: 'StrongPassword123' },
    });
    fireEvent.click(screen.getByTestId('auth-terms-checkbox'));
    fireEvent.click(screen.getByText('auth.signUp.submit'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/sign-up', expect.any(Object));
      expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
        phone: '+1234567890',
        password: 'StrongPassword123',
        locale: 'en',
      });
      expect(screen.getByLabelText('auth.common.otpLabel')).toBeTruthy();
    });
  });

  test('password recovery sends OTP and verifies it with a new password', async () => {
    mockFetch
      .mockResolvedValueOnce(success())
      .mockResolvedValueOnce(success({ onboardingComplete: false }));
    render(<PasswordRecoveryForm locale="en" />);

    fireEvent.change(screen.getByLabelText('auth.passwordRecovery.phoneLabel'), {
      target: { value: '+1234567890' },
    });
    fireEvent.click(screen.getByText('auth.passwordRecovery.submit'));
    await waitFor(() => expect(screen.getByLabelText('auth.common.otpLabel')).toBeTruthy());

    fireEvent.change(screen.getByLabelText('auth.common.otpLabel'), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByLabelText('auth.common.newPasswordLabel'), {
      target: { value: 'NewPassword123' },
    });
    fireEvent.change(screen.getByLabelText('auth.common.confirmPasswordLabel'), {
      target: { value: 'NewPassword123' },
    });
    fireEvent.click(screen.getByTestId('auth-submit-otp'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        '/api/v1/auth/password-recovery',
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        '/api/v1/auth/password-recovery/verify',
        expect.any(Object),
      );
      expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({
        phone: '+1234567890',
        code: '123456',
        password: 'NewPassword123',
      });
      expect(mockReplace).toHaveBeenCalledWith('/en/m/onboarding');
    });
  });

  test('sign-up associates consent disclosure and legal links with the phone field', () => {
    render(<SignUpForm locale="en" />);
    const phoneInput = screen.getByLabelText('auth.signUp.phoneLabel');
    const disclosure = screen.getByTestId('sms-consent-disclosure');
    const legalHrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));

    expect(phoneInput.getAttribute('aria-describedby')).toContain(disclosure.id);
    expect(legalHrefs).toContain('/legal/en/privacy-policy');
    expect(legalHrefs).toContain('/legal/en/terms-of-use');
  });
});
