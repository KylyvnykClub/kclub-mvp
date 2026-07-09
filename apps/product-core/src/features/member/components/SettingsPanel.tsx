'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import type { CurrentMemberProfileDto } from '@kclub/contracts';

import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';
import { locales } from '@/i18n/routing';
import {
  cabinetContentClasses,
  cabinetFieldLabelClasses,
  cabinetSectionLabelClasses,
} from '@/features/member/components/cabinet/styles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/reui/badge';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/reui/alert';

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
      <Switch checked={enabled} onCheckedChange={onToggle} />
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
            <ToggleGroup
              type="single"
              value={loginMethod}
              onValueChange={(value) => {
                if (value) setLoginMethod(value as LoginMethod);
              }}
              spacing={0}
              variant="outline"
              className="mt-3 w-full max-w-md"
            >
              {(['phone', 'email'] as const).map((method) => (
                <ToggleGroupItem
                  key={method}
                  value={method}
                  className="h-auto flex-1 flex-col items-start gap-0.5 px-4 py-3.5 text-left"
                >
                  <p className="text-sm font-semibold">
                    {t(`login${method === 'phone' ? 'Phone' : 'Email'}`)}
                  </p>
                  <p className="mt-0.5 text-xs opacity-70">
                    {t(`login${method === 'phone' ? 'Phone' : 'Email'}Hint`)}
                  </p>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {loginMethod === 'phone' ? (
            <div>
              <p className={cabinetFieldLabelClasses}>{t('loginPhoneLabel')}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Input
                  type="text"
                  value={profile.phone}
                  readOnly
                  className="w-56 cursor-default bg-background text-muted-foreground"
                />
                <Badge variant="success-light">
                  <Check aria-hidden />
                  {t('verified')}
                </Badge>
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
            <Input
              id="settings-old-pass"
              type="password"
              value={oldPass}
              onChange={(event) => setOldPass(event.target.value)}
              placeholder={t('currentPasswordPlaceholder')}
              className="mt-2 w-full"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="settings-new-pass" className={cabinetFieldLabelClasses}>
                {t('newPassword')}
              </label>
              <Input
                id="settings-new-pass"
                type="password"
                value={newPass}
                onChange={(event) => setNewPass(event.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label htmlFor="settings-confirm-pass" className={cabinetFieldLabelClasses}>
                {t('confirmPassword')}
              </label>
              <Input
                id="settings-confirm-pass"
                type="password"
                value={confirmPass}
                onChange={(event) => setConfirmPass(event.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                className="mt-2 w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button type="button" onClick={handleSavePassword}>
              {t('updatePassword')}
            </Button>
            {passSaved ? (
              <Alert variant="success" className="w-auto py-1.5">
                <AlertDescription>{t('passwordUpdated')}</AlertDescription>
              </Alert>
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
          <Select
            value={profile.localePreference ?? locale}
            onValueChange={(value) => handleLocaleChange(value as Locale)}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locales.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`languages.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section>
        <h2 className="border-destructive/20 mb-6 border-b pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-destructive">
          {t('dangerSection')}
        </h2>
        <Alert variant="destructive" className="py-4">
          <AlertTitle>{t('deleteAccount')}</AlertTitle>
          <AlertDescription>{t('deleteAccountHint')}</AlertDescription>
          <AlertAction>
            <Button type="button" variant="destructive" size="sm" disabled>
              {t('deleteAccountCta')}
            </Button>
          </AlertAction>
        </Alert>
      </section>
    </div>
  );
}
