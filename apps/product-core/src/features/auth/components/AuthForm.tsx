'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { ERROR_CODES } from '@kclub/contracts';
import { Button, Field, Input, Label, linkClasses, PhoneInput, textMuted } from '@kclub/ui';

import crowLogo from '@/assets/logo/crow--logo.webp';
import {
  defaultCountryForLocale,
  kclubPhonePanelClassName,
  kclubPhoneTriggerClassName,
  renderCountryFlag,
} from '@/components/ui/country-flag';
import { Locale } from '@/i18n/routing';
import { parseAuthResponse } from '../utils/api';

export type AuthMode = 'sign-in' | 'sign-up' | 'password-recovery';

const AUTH_REQUEST_TIMEOUT_MS = 15_000;

type FormStep = 'credentials' | 'phone' | 'otp';

export function AuthForm({ locale, mode }: { locale: Locale; mode: AuthMode }) {
  const isSignUp = mode === 'sign-up';
  const isRecovery = mode === 'password-recovery';
  const namespace = isSignUp ? 'auth.signUp' : isRecovery ? 'auth.passwordRecovery' : 'auth.signIn';
  const t = useTranslations(namespace);
  const tCommon = useTranslations('auth.common');
  const router = useRouter();

  const [step, setStep] = useState<FormStep>(isRecovery ? 'phone' : 'credentials');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step === 'otp') {
      setCountdown(60);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [step]);
  const termsHref = `/legal/${locale}/terms-of-use`;
  const privacyHref = `/legal/${locale}/privacy-policy`;
  const phoneDescriptionIds = [
    isSignUp ? 'sms-consent-disclosure' : null,
    error ? 'auth-error' : null,
  ]
    .filter(Boolean)
    .join(' ');

  function redirectForProfile(profile: { onboardingComplete?: boolean } | null | undefined): void {
    router.replace(
      profile?.onboardingComplete ? `/${locale}/m/dashboard` : `/${locale}/m/onboarding`,
    );
  }

  function getErrorMessage(code: string | null | undefined): string {
    if (code === ERROR_CODES.VALIDATION_INVALID_PHONE) {
      return tCommon('errors.invalidPhone');
    }
    if (code === ERROR_CODES.AUTH_SIGN_IN_USE_SIGN_UP) return tCommon('errors.useSignUp');
    if (code === ERROR_CODES.AUTH_SIGN_UP_USE_SIGN_IN) return tCommon('errors.useSignIn');
    if (code === ERROR_CODES.PERMISSION_DENIED) return tCommon('errors.blocked');
    if (code === ERROR_CODES.AUTH_PASSWORD_INVALID) return tCommon('errors.invalidPassword');
    if (code === ERROR_CODES.AUTH_OTP_INVALID) return tCommon('errors.invalidOtp');
    if (code === ERROR_CODES.AUTH_OTP_SEND_FAILED) return tCommon('errors.otpSendFailed');
    if (code === ERROR_CODES.RATE_LIMITED) return tCommon('errors.rateLimited');
    return tCommon('errors.generic');
  }

  async function submit(
    path: string,
    body: Record<string, string>,
  ): Promise<ReturnType<typeof parseAuthResponse>> {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
      body: JSON.stringify(body),
    });
    return parseAuthResponse(response);
  }

  async function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const parsed = await submit(isSignUp ? '/api/v1/auth/sign-up' : '/api/v1/auth/sign-in', {
        phone,
        password,
        ...(isSignUp ? { locale } : {}),
      });
      if (!parsed.success) {
        setError(getErrorMessage(parsed.errorCode));
        return;
      }
      if (isSignUp) setStep('otp');
      else redirectForProfile(parsed.data as { onboardingComplete?: boolean } | undefined);
    } catch {
      setError(tCommon('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRecoveryPhoneSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const parsed = await submit('/api/v1/auth/password-recovery', { phone });
      if (!parsed.success) {
        setError(getErrorMessage(parsed.errorCode));
        return;
      }
      setStep('otp');
    } catch {
      setError(tCommon('errors.otpSendFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (isRecovery && password !== confirmPassword) {
      setError(tCommon('errors.passwordMismatch'));
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const parsed = await submit(
        isRecovery ? '/api/v1/auth/password-recovery/verify' : '/api/v1/auth/sign-up/verify',
        isRecovery ? { phone, code: otp, password } : { phone, code: otp },
      );
      if (!parsed.success) {
        setError(getErrorMessage(parsed.errorCode));
        return;
      }
      redirectForProfile(parsed.data as { onboardingComplete?: boolean } | undefined);
    } catch {
      setError(tCommon('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  }

  const showPhone = step === 'credentials' || step === 'phone';

  return (
    <div className="container grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center">
      <section className="hidden lg:block">
        <Image
          src={crowLogo}
          alt=""
          aria-hidden
          className="mb-8 block h-16 w-16 rounded-full object-cover"
        />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
        <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
          {t('description')}
        </p>
      </section>

      <div className="relative mx-auto w-full max-w-[440px] overflow-hidden border border-border bg-surface p-6 shadow-xl sm:p-8">
        <div className="mb-10 text-center lg:hidden">
          <Image
            src={crowLogo}
            alt=""
            aria-hidden
            className="mx-auto mb-6 block h-14 w-14 rounded-full object-cover"
          />
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {t('title')}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t('description')}</p>
        </div>

        {showPhone && (
          <form
            className="space-y-6"
            onSubmit={isRecovery ? handleRecoveryPhoneSubmit : handleCredentialsSubmit}
          >
            <Field>
              <Label htmlFor="phone">{t('phoneLabel')}</Label>
              <PhoneInput
                id="phone"
                name="phone"
                defaultCountry={defaultCountryForLocale(locale)}
                renderFlag={renderCountryFlag}
                required
                {...(phoneDescriptionIds ? { 'aria-describedby': phoneDescriptionIds } : {})}
                placeholder={t('phonePlaceholder')}
                value={phone}
                onChange={setPhone}
                disabled={isLoading}
                inputClassName="kclub-field"
                triggerClassName={kclubPhoneTriggerClassName}
                panelClassName={kclubPhonePanelClassName}
                data-testid="auth-phone-input"
              />
            </Field>
            {!isRecovery && (
              <Field>
                <Label htmlFor="password">{tCommon('passwordLabel')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  minLength={6}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isLoading}
                  className="kclub-field"
                  placeholder={tCommon('passwordPlaceholder')}
                  data-testid="auth-password-input"
                />
              </Field>
            )}
            {error && (
              <p id="auth-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              color="brand"
              size="lg"
              fullWidth
              disabled={isLoading}
              data-testid="auth-submit"
            >
              {isLoading ? tCommon('loading') : t('submit')}
              <ArrowUpRight aria-hidden size={16} strokeWidth={1.7} />
            </Button>
            {isSignUp && (
              <div className="space-y-3">
                <label className="flex gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    disabled={isLoading}
                    required
                    className="kclub-checkbox mt-1"
                    data-testid="auth-terms-checkbox"
                  />
                  <span>
                    {tCommon.rich('termsLabel', {
                      terms: (chunks) => (
                        <Link
                          href={termsHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClasses}
                        >
                          {chunks}
                        </Link>
                      ),
                      privacy: (chunks) => (
                        <Link
                          href={privacyHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClasses}
                        >
                          {chunks}
                        </Link>
                      ),
                    })}
                  </span>
                </label>
                <p
                  id="sms-consent-disclosure"
                  className="text-micro text-muted-foreground"
                  data-testid="sms-consent-disclosure"
                >
                  {t.rich('smsConsentDisclosure', {
                    privacy: (chunks) => (
                      <Link
                        href={privacyHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClasses}
                      >
                        {chunks}
                      </Link>
                    ),
                    terms: (chunks) => (
                      <Link
                        href={termsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClasses}
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </p>
              </div>
            )}
          </form>
        )}

        {step === 'otp' && (
          <form className="space-y-6" onSubmit={handleOtpSubmit}>
            <Field>
              <div className="flex items-center justify-between">
                <Label htmlFor="otp">{tCommon('otpLabel')}</Label>
                {countdown > 0 && (
                  <span className="tabular-nums text-xs text-muted-foreground">{countdown}s</span>
                )}
              </div>
              <Input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                disabled={isLoading}
                className="kclub-field"
                placeholder={tCommon('otpPlaceholder')}
                data-testid="auth-otp-input"
              />
            </Field>
            {isRecovery && (
              <>
                <Field>
                  <Label htmlFor="new-password">{tCommon('newPasswordLabel')}</Label>
                  <Input
                    id="new-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isLoading}
                    className="kclub-field"
                    placeholder={tCommon('passwordPlaceholder')}
                  />
                </Field>
                <Field>
                  <Label htmlFor="confirm-password">{tCommon('confirmPasswordLabel')}</Label>
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={128}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={isLoading}
                    className="kclub-field"
                    placeholder={tCommon('confirmPasswordPlaceholder')}
                  />
                </Field>
              </>
            )}
            {error && (
              <p id="auth-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              color="brand"
              size="lg"
              fullWidth
              disabled={isLoading}
              data-testid="auth-submit-otp"
            >
              {isLoading ? tCommon('loading') : tCommon('submitOtp')}
              <ArrowUpRight aria-hidden size={16} strokeWidth={1.7} />
            </Button>
            <Button
              type="button"
              color="ghost"
              fullWidth
              disabled={isLoading}
              onClick={() => {
                setStep(isRecovery ? 'phone' : 'credentials');
                setError(null);
                setOtp('');
              }}
            >
              {tCommon('backToPhone')}
            </Button>
          </form>
        )}

        {step !== 'otp' && (
          <div className={`mt-6 text-center ${textMuted}`}>
            {isRecovery ? (
              <Link href={`/${locale}/sign-in`} className={linkClasses}>
                {t('signInAction')}
              </Link>
            ) : (
              <>
                <span>{t('switchPrompt')} </span>
                <Link
                  href={`/${locale}/${isSignUp ? 'sign-in' : 'sign-up'}`}
                  className={linkClasses}
                >
                  {t('switchAction')}
                </Link>
                {!isSignUp && (
                  <>
                    <span className="mx-2" aria-hidden>
                      ·
                    </span>
                    <Link href={`/${locale}/forgot-password`} className={linkClasses}>
                      {t('forgotPassword')}
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
