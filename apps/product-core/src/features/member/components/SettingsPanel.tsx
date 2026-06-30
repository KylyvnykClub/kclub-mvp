'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import type { CurrentMemberProfileDto } from '@kclub/contracts';
import { Button, cn } from '@kclub/ui';

import type { Locale } from '@/i18n/routing';
import { locales } from '@/i18n/routing';
import {
  cabinetContentClasses,
  cabinetFieldLabelClasses,
  cabinetSectionLabelClasses,
} from '@/features/member/components/cabinet/styles';

type SettingsPanelProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
};

type LoginMethod = 'phone' | 'email';

function SettingsToggle({
  enabled,
  onToggle,
  label,
  description,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={cn(
          'relative h-[22px] w-10 shrink-0 rounded-full transition',
          enabled ? 'bg-accent' : 'bg-surface-muted',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-4 w-4 rounded-full bg-white transition',
            enabled ? 'left-[21px]' : 'left-[3px]',
          )}
        />
      </button>
    </div>
  );
}

export function SettingsPanel({ locale, profile }: SettingsPanelProps) {
  const t = useTranslations('member.dashboard.settings');
  const router = useRouter();

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSaved, setPassSaved] = useState(false);

  const handleLocaleChange = (nextLocale: Locale) => {
    router.push(`/${nextLocale}/m/dashboard?tab=settings`);
  };

  const handleSavePassword = () => {
    // TODO(KCLUB-SETTINGS): Wire password update API when member email/password auth ships.
    setPassSaved(true);
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
    window.setTimeout(() => setPassSaved(false), 2200);
  };

  return (
    <div className={cn(cabinetContentClasses, 'w-full')}>
      <section className="mb-12">
        <h2 className={cn(cabinetSectionLabelClasses, 'mb-6 border-b border-border pb-3')}>
          {t('authSection')}
        </h2>
        <div className="space-y-6">
          <div>
            <p className={cabinetFieldLabelClasses}>{t('loginMethod')}</p>
            <div className="mt-3 flex max-w-md gap-0.5">
              {(['phone', 'email'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setLoginMethod(method)}
                  className={cn(
                    'flex-1 border px-4 py-3.5 text-left transition',
                    loginMethod === method
                      ? 'border-accent/30 border-t-2 border-t-accent bg-surface-muted text-foreground'
                      : 'border-border bg-surface text-muted-foreground',
                  )}
                >
                  <p className="text-sm font-semibold">{t(`login${method === 'phone' ? 'Phone' : 'Email'}`)}</p>
                  <p className="mt-0.5 text-xs opacity-70">{t(`login${method === 'phone' ? 'Phone' : 'Email'}Hint`)}</p>
                </button>
              ))}
            </div>
          </div>

          {loginMethod === 'phone' ? (
            <div>
              <p className={cabinetFieldLabelClasses}>{t('loginPhoneLabel')}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={profile.phone}
                  readOnly
                  className="kclub-field w-56 cursor-default bg-background text-muted-foreground"
                />
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                  <Check size={13} aria-hidden />
                  {t('verified')}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{t('loginPhoneHelp')}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('emailLoginUnavailable')}</p>
          )}
        </div>
      </section>

      <section className="mb-12">
        <h2 className={cn(cabinetSectionLabelClasses, 'mb-6 border-b border-border pb-3')}>
          {t('securitySection')}
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="settings-old-pass" className={cabinetFieldLabelClasses}>
              {t('currentPassword')}
            </label>
            <input
              id="settings-old-pass"
              type="password"
              value={oldPass}
              onChange={(event) => setOldPass(event.target.value)}
              placeholder={t('currentPasswordPlaceholder')}
              className="kclub-field mt-2 w-full"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="settings-new-pass" className={cabinetFieldLabelClasses}>
                {t('newPassword')}
              </label>
              <input
                id="settings-new-pass"
                type="password"
                value={newPass}
                onChange={(event) => setNewPass(event.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                className="kclub-field mt-2 w-full"
              />
            </div>
            <div>
              <label htmlFor="settings-confirm-pass" className={cabinetFieldLabelClasses}>
                {t('confirmPassword')}
              </label>
              <input
                id="settings-confirm-pass"
                type="password"
                value={confirmPass}
                onChange={(event) => setConfirmPass(event.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                className="kclub-field mt-2 w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              color="primary"
              size="md"
              onClick={handleSavePassword}
            >
              {t('updatePassword')}
            </Button>
            {passSaved ? (
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {t('passwordUpdated')}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className={cn(cabinetSectionLabelClasses, 'mb-6 border-b border-border pb-3')}>
          {t('notificationsSection')}
        </h2>
        <div className="space-y-5">
          <SettingsToggle
            enabled={emailNotifs}
            onToggle={() => setEmailNotifs((value) => !value)}
            label={t('emailNotifications')}
            description={t('emailNotificationsHint')}
          />
          <SettingsToggle
            enabled={pushNotifs}
            onToggle={() => setPushNotifs((value) => !value)}
            label={t('pushNotifications')}
            description={t('pushNotificationsHint')}
          />
          <SettingsToggle
            enabled={newsletter}
            onToggle={() => setNewsletter((value) => !value)}
            label={t('newsletter')}
            description={t('newsletterHint')}
          />
        </div>
      </section>

      <section className="mb-14">
        <h2 className={cn(cabinetSectionLabelClasses, 'mb-6 border-b border-border pb-3')}>
          {t('preferencesSection')}
        </h2>
        <div className="grid items-center gap-3 sm:grid-cols-[200px_1fr]">
          <p className="text-sm font-semibold text-foreground">{t('displayLanguage')}</p>
          <select
            value={profile.localePreference ?? locale}
            onChange={(event) => handleLocaleChange(event.target.value as Locale)}
            className="kclub-field max-w-xs"
          >
            {locales.map((value) => (
              <option key={value} value={value}>
                {t(`languages.${value}`)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        <h2 className="mb-6 border-b border-destructive/20 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-destructive">
          {t('dangerSection')}
        </h2>
        <div className="flex flex-col gap-4 border border-destructive/20 bg-surface-muted p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{t('deleteAccount')}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('deleteAccountHint')}</p>
          </div>
          <Button
            type="button"
            color="destructive"
            size="sm"
            disabled
            className="shrink-0"
          >
            {t('deleteAccountCta')}
          </Button>
        </div>
      </section>
    </div>
  );
}
