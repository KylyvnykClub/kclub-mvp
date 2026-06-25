'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button, Field, Input, Label, linkClasses, textMuted } from '@kclub/ui';
import { Locale } from '@/i18n/routing';
import { parseAuthResponse } from '../utils/api';

export function SignUpForm({ locale }: { locale: Locale }) {
  const t = useTranslations('auth.signUp');
  const tCommon = useTranslations('auth.common');
  const router = useRouter();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputClassName = 'kclub-field';
  const buttonClassName =
    'kclub-button-primary w-full rounded-none border-0 px-5 py-3.5 text-xs tracking-[0.26em]';

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/phone-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'sign-up', locale }),
      });
      const parsed = await parseAuthResponse(res);

      if (!parsed.success) {
        const code = parsed.errorCode || 'generic';
        if (code === 'VALIDATION_INVALID_PHONE' || code === 'VALIDATION_INVALID_INPUT') {
          setError(tCommon('errors.invalidPhone'));
        } else if (code === 'AUTH_SIGN_UP_USE_SIGN_IN') {
          setError(tCommon('errors.useSignIn'));
        } else if (code === 'PERMISSION_DENIED') {
          setError(tCommon('errors.blocked'));
        } else {
          setError(tCommon('errors.generic'));
        }
        setIsLoading(false);
        return;
      }

      setStep('otp');
    } catch (err) {
      setError(tCommon('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/phone-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp, purpose: 'sign-up' }),
      });
      const parsed = await parseAuthResponse(res);

      if (!parsed.success) {
        const code = parsed.errorCode || 'generic';
        if (code === 'AUTH_OTP_INVALID') {
          setError(tCommon('errors.invalidOtp'));
        } else if (code === 'PERMISSION_DENIED') {
          setError(tCommon('errors.blocked'));
        } else {
          setError(tCommon('errors.generic'));
        }
        setIsLoading(false);
        return;
      }

      if (parsed.data?.onboardingComplete) {
        router.replace(`/${locale}/m/dashboard`);
      } else {
        router.replace(`/${locale}/m/onboarding`);
      }
    } catch (err) {
      setError(tCommon('errors.generic'));
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center container">
      <section className="hidden lg:block">
        <h1 className="mt-5 text-5xl font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white">
          {t('title')}
        </h1>
        <p className="dark:text-white/68 mt-5 max-w-xl text-base leading-8 text-zinc-600">
          {t('description')}
        </p>
      </section>

      <div className="relative mx-auto w-full max-w-[440px] overflow-hidden border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 dark:bg-surface sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-accent" />

        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-surface-muted">
            <svg
              className="h-6 w-6 text-zinc-700 dark:text-white/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.01em] text-zinc-900 dark:text-white">
            {t('title')}
          </h2>
          <p className="dark:text-white/62 mt-3 text-sm leading-7 text-zinc-600">
            {t('description')}
          </p>
        </div>

        {step === 'phone' ? (
          <form className="space-y-6" onSubmit={handlePhoneSubmit}>
            <Field>
              <Label htmlFor="phone">{t('phoneLabel')}</Label>
              <Input
                id="phone"
                name="phone"
                data-testid="auth-phone-input"
                type="tel"
                autoComplete="tel"
                required
                aria-invalid={!!error ? 'true' : 'false'}
                aria-describedby={error ? 'phone-error' : undefined}
                placeholder={t('phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                className={inputClassName}
              />
            </Field>
            {error && (
              <p id="phone-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              className={buttonClassName}
              data-testid="auth-submit-phone"
            >
              {isLoading ? tCommon('loading') : t('submit')}
              <ArrowRight aria-hidden="true" size={16} strokeWidth={1.7} />
            </Button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleOtpSubmit}>
            <Field>
              <Label htmlFor="otp">{tCommon('otpLabel')}</Label>
              <Input
                id="otp"
                name="otp"
                data-testid="auth-otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                aria-invalid={!!error ? 'true' : 'false'}
                aria-describedby={error ? 'otp-error' : undefined}
                placeholder={tCommon('otpPlaceholder')}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isLoading}
                className={inputClassName}
              />
            </Field>
            {error && (
              <p id="otp-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              className={buttonClassName}
              data-testid="auth-submit-otp"
            >
              {isLoading ? tCommon('loading') : tCommon('submitOtp')}
              <ArrowRight aria-hidden="true" size={16} strokeWidth={1.7} />
            </Button>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setError(null);
                  setOtp('');
                }}
                className={linkClasses}
                disabled={isLoading}
              >
                {tCommon('backToPhone')}
              </button>
            </div>
          </form>
        )}

        {step === 'phone' && (
          <p className={`mt-6 text-center ${textMuted}`}>
            {t('switchPrompt')}{' '}
            <Link href={`/${locale}/sign-in`} className={linkClasses}>
              {t('switchAction')}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
