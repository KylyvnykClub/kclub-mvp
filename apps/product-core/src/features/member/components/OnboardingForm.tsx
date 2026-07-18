'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import type { CurrentMemberProfileDto, Locale } from '@kclub/contracts';
import { Button, Field, FieldError, Input, Label } from '@kclub/ui';
import { MEMBER_API_ROUTES } from '@kclub/contracts';

import { parseAuthResponse } from '@/features/auth/utils/api';

type OnboardingFormProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
};

export function OnboardingForm({ locale, profile }: OnboardingFormProps) {
  const t = useTranslations('member.onboarding');
  const tCommon = useTranslations('member.common');
  const router = useRouter();
  const errorId = useId();

  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [email, setEmail] = useState(profile.email ?? '');
  const localePreference = profile.localePreference ?? locale;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputClassName = 'kclub-field';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(MEMBER_API_ROUTES.COMPLETE_ONBOARDING, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: profile.phone,
          displayName,
          email: email.trim() === '' ? null : email.trim(),
          localePreference,
          termsAccepted: true,
        }),
      });
      const result = await parseAuthResponse<CurrentMemberProfileDto>(response);

      if (!result.success) {
        const code = result.errorCode;
        if (code === 'VALIDATION_INVALID_PHONE') {
          setError(t('errors.phoneMismatch'));
        } else if (code === 'VALIDATION_INVALID_LOCALE') {
          setError(t('errors.invalidLocale'));
        } else if (code === 'AUTH_SESSION_REQUIRED') {
          setError(t('errors.session'));
        } else {
          setError(t('errors.invalidInput'));
        }
        return;
      }

      router.replace(`/${locale}/m/dashboard?tab=overview`);
      router.refresh();
    } catch {
      setError(tCommon('genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Field>
        <Label htmlFor="phone">{t('phoneLabel')}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={profile.phone}
          disabled
          readOnly
          className={inputClassName}
        />
      </Field>

      <Field>
        <Label htmlFor="displayName">{t('displayNameLabel')}</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          placeholder={t('displayNamePlaceholder')}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          disabled={isLoading}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={inputClassName}
        />
      </Field>

      <Field>
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={255}
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={inputClassName}
        />
      </Field>

      <FieldError id={errorId} role="alert">
        {error}
      </FieldError>

      <Button type="submit" color="brand" size="lg" fullWidth disabled={isLoading}>
        {isLoading ? tCommon('saving') : t('submit')}
      </Button>
    </form>
  );
}
