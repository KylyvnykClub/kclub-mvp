'use client';

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import crowLogo from '@/assets/logo/crow--logo.png';
import { Button, Field, Input, Label, linkClasses, PhoneInput, textMuted } from '@kclub/ui';
import {
  defaultCountryForLocale,
  kclubPhonePanelClassName,
  kclubPhoneTriggerClassName,
  renderCountryFlag,
} from '@/components/ui/country-flag';
import { Locale } from '@/i18n/routing';
import { parseAuthResponse } from '../utils/api';

export function SignInForm({ locale }: { locale: Locale }) {
  const t = useTranslations('auth.signIn');
  const tCommon = useTranslations('auth.common');
  const router = useRouter();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputClassName = 'kclub-field';

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/phone-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'sign-in', locale }),
      });
      const parsed = await parseAuthResponse(res);

      if (!parsed.success) {
        const code = parsed.errorCode || 'generic';
        if (code === 'VALIDATION_INVALID_PHONE' || code === 'VALIDATION_INVALID_INPUT') {
          setError(tCommon('errors.invalidPhone'));
        } else if (code === 'AUTH_SIGN_IN_USE_SIGN_UP') {
          setError(tCommon('errors.useSignUp'));
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
        body: JSON.stringify({ phone, code: otp, purpose: 'sign-in' }),
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
        <div className="mb-10 text-center">
          <Image
            src={crowLogo}
            alt=""
            aria-hidden="true"
            className="mx-auto mb-6 block h-14 w-14 rounded-full object-cover"
          />
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
              <PhoneInput
                id="phone"
                name="phone"
                defaultCountry={defaultCountryForLocale(locale)}
                renderFlag={renderCountryFlag}
                required
                aria-describedby={error ? 'phone-error' : undefined}
                placeholder={t('phonePlaceholder')}
                value={phone}
                onChange={(value) => setPhone(value)}
                disabled={isLoading}
                inputClassName={inputClassName}
                triggerClassName={kclubPhoneTriggerClassName}
                panelClassName={kclubPhonePanelClassName}
                data-testid="auth-phone-input"
              />
            </Field>
            {error && (
              <p id="phone-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <Button
              type="submit"
              color="brand"
              size="lg"
              fullWidth
              disabled={isLoading}
              data-testid="auth-submit-phone"
            >
              {isLoading ? tCommon('loading') : t('submit')}
              <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.7} />
            </Button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleOtpSubmit}>
            <Field>
              <Label htmlFor="otp">{tCommon('otpLabel')}</Label>
              <Input
                id="otp"
                name="otp"
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
                data-testid="auth-otp-input"
              />
            </Field>
            {error && (
              <p id="otp-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
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
              <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.7} />
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
            <Link href={`/${locale}/sign-up`} className={linkClasses}>
              {t('switchAction')}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
