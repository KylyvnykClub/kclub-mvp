import { describe, expect, test, mock, afterEach } from 'bun:test';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock next/navigation
const mockReplace = mock();
const mockRefresh = mock();
mock.module('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

// Mock next-intl
mock.module('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const t = (key: string) => `${namespace}.${key}`;
    t.rich = (key: string, values: Record<string, (chunks: unknown) => unknown>) =>
      Object.values(values).reduce<unknown>(
        (acc, render) => render(acc),
        `${namespace}.${key}`,
      );
    return t;
  },
}));

import { SignInForm } from '@/features/auth/components/SignInForm';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { SignOutButton } from '@/features/auth/components/SignOutButton';

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('Auth Forms', () => {
  afterEach(() => {
    mockFetch.mockReset();
    mockReplace.mockReset();
    mockRefresh.mockReset();
  });

  test('SignInForm transitions to OTP on successful phone submit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null, error: null }),
    } as Response);

    render(<SignInForm locale="en" />);

    const phoneInput = screen.getByLabelText('auth.signIn.phoneLabel');
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });

    const submitButton = screen.getByText('auth.signIn.submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/phone-otp/send', expect.any(Object));
      // check if body contains purpose sign-in
      const callArgs = mockFetch.mock.calls[0][1];
      expect(JSON.parse(callArgs.body)).toEqual({
        phone: '+1234567890',
        purpose: 'sign-in',
        locale: 'en',
      });
      expect(screen.getByLabelText('auth.common.otpLabel')).toBeTruthy();
    });
  });

  test('SignInForm shows error for unknown phone', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { code: 'AUTH_SIGN_IN_USE_SIGN_UP' },
      }),
    } as Response);

    render(<SignInForm locale="en" />);

    const phoneInput = screen.getByLabelText('auth.signIn.phoneLabel');
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });

    const submitButton = screen.getByText('auth.signIn.submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('auth.common.errors.useSignUp')).toBeTruthy();
      expect(screen.queryByLabelText('auth.common.otpLabel')).toBeNull();
    });
  });

  test('SignUpForm transitions to OTP on successful phone submit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null, error: null }),
    } as Response);

    render(<SignUpForm locale="en" />);

    const phoneInput = screen.getByLabelText('auth.signUp.phoneLabel');
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    fireEvent.click(screen.getByTestId('auth-terms-checkbox'));

    const submitButton = screen.getByText('auth.signUp.submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/phone-otp/send', expect.any(Object));
      const callArgs = mockFetch.mock.calls[0][1];
      expect(JSON.parse(callArgs.body)).toEqual({
        phone: '+1234567890',
        purpose: 'sign-up',
        locale: 'en',
      });
      expect(screen.getByLabelText('auth.common.otpLabel')).toBeTruthy();
    });
  });

  test('SignUpForm shows error for existing phone', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { code: 'AUTH_SIGN_UP_USE_SIGN_IN' },
      }),
    } as Response);

    render(<SignUpForm locale="en" />);

    const phoneInput = screen.getByLabelText('auth.signUp.phoneLabel');
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    fireEvent.click(screen.getByTestId('auth-terms-checkbox'));

    const submitButton = screen.getByText('auth.signUp.submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('auth.common.errors.useSignIn')).toBeTruthy();
      expect(screen.queryByLabelText('auth.common.otpLabel')).toBeNull();
    });
  });

  test('Back to phone button works', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null, error: null }),
    } as Response);

    render(<SignInForm locale="en" />);

    // Submit phone
    fireEvent.change(screen.getByLabelText('auth.signIn.phoneLabel'), {
      target: { value: '+1234567890' },
    });
    fireEvent.click(screen.getByText('auth.signIn.submit'));

    // Wait for OTP step
    await waitFor(() => {
      expect(screen.getByLabelText('auth.common.otpLabel')).toBeTruthy();
    });

    // Click back
    fireEvent.click(screen.getByText('auth.common.backToPhone'));

    // Should be back to phone step
    await waitFor(() => {
      expect(screen.getByLabelText('auth.signIn.phoneLabel')).toBeTruthy();
    });
  });

  test('successful incomplete profile redirects to /m/onboarding', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null, error: null }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { onboardingComplete: false }, error: null }),
      } as Response);

    render(<SignInForm locale="en" />);

    fireEvent.change(screen.getByLabelText('auth.signIn.phoneLabel'), {
      target: { value: '+1234567890' },
    });
    fireEvent.click(screen.getByText('auth.signIn.submit'));

    await waitFor(() => {
      expect(screen.getByLabelText('auth.common.otpLabel')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('auth.common.otpLabel'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByText('auth.common.submitOtp'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/en/m/onboarding');
    });
  });

  test('successful complete profile redirects to /m/dashboard', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null, error: null }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { onboardingComplete: true }, error: null }),
      } as Response);

    render(<SignInForm locale="en" />);

    fireEvent.change(screen.getByLabelText('auth.signIn.phoneLabel'), {
      target: { value: '+1234567890' },
    });
    fireEvent.click(screen.getByText('auth.signIn.submit'));

    await waitFor(() => {
      expect(screen.getByLabelText('auth.common.otpLabel')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('auth.common.otpLabel'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByText('auth.common.submitOtp'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/en/m/dashboard');
    });
  });

  test('sign-out posts logout and redirects to /en/sign-in', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null, error: null }),
    } as Response);

    render(<SignOutButton locale="en">Sign Out</SignOutButton>);

    fireEvent.click(screen.getByText('Sign Out'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/logout', { method: 'POST' });
      expect(mockReplace).toHaveBeenCalledWith('/en/sign-in');
    });
  });
});
