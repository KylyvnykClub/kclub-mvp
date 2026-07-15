'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Camera } from 'lucide-react';
import { toast } from 'sonner';

import type { CurrentMemberProfileDto } from '@kclub/contracts';
import { MEMBER_API_ROUTES } from '@kclub/contracts';
import { Spinner } from '@kclub/ui';

import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';
import { locales } from '@/i18n/routing';
import { parseAuthResponse } from '@/features/auth/utils/api';
import {
  cabinetContentClasses,
  cabinetFieldLabelClasses,
  cabinetSectionLabelClasses,
} from '@/features/member/components/cabinet/styles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/reui/alert';

type SettingsPanelProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
};

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

function getInitials(name: string | null, phone: string): string {
  if (!name) {
    return phone.charAt(phone.length - 1).toUpperCase();
  }

  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getButtonLabel(label: string): string {
  return label.replace(/\s*\u2192\s*$/, '');
}

export function SettingsPanel({ locale, profile }: SettingsPanelProps) {
  const t = useTranslations('member.dashboard.settings');
  const tAccount = useTranslations('member.dashboard.account');
  const tCommon = useTranslations('member.common');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [localePreference, setLocalePreference] = useState<Locale>(
    profile.localePreference ?? locale,
  );
  const [country, setCountry] = useState(profile.country ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [about, setAbout] = useState(profile.about ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const memberName = displayName || profile.displayName || profile.phone;

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/me/avatar', { method: 'POST', body: formData });
      const result = await parseAuthResponse<CurrentMemberProfileDto>(res);

      if (!result.success || !result.data) {
        toast.error(tAccount('avatarUploadError'));
        return;
      }

      setAvatarUrl(result.data.avatarUrl ?? '');
      router.refresh();
    } catch {
      toast.error(tAccount('avatarUploadError'));
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);

    try {
      const res = await fetch(MEMBER_API_ROUTES.ME, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName || undefined,
          localePreference,
          country: country || null,
          city: city || null,
          about: about || null,
        }),
      });

      const result = await parseAuthResponse<CurrentMemberProfileDto>(res);

      if (!result.success) {
        toast.error(tAccount('saveError'));
        return;
      }

      toast.success(tAccount('saveSuccess'));
      router.refresh();
    } catch {
      toast.error(tAccount('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn(cabinetContentClasses, 'w-full')}>
      <section className="mb-12">
        <h2 className={cn(cabinetSectionLabelClasses, 'mb-6 border-b border-border pb-3')}>
          {tAccount('title')}
        </h2>

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleAvatarClick}
            aria-label={tAccount('avatar')}
            className="relative h-auto w-fit rounded-full p-0"
          >
            <Avatar className="border-accent/25 size-20 border bg-surface-muted">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={memberName} /> : null}
              <AvatarFallback className="bg-transparent text-2xl font-semibold text-accent">
                {getInitials(displayName || profile.displayName, profile.phone)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover/button:opacity-100">
              {isUploadingAvatar ? <Spinner size={18} /> : <Camera size={18} aria-hidden />}
            </span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground">{memberName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{profile.phone}</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-display-name" className={cabinetFieldLabelClasses}>
              {tAccount('displayName')}
            </label>
            <Input
              id="settings-display-name"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={100}
              disabled={isSaving}
              className="mt-2 w-full rounded-none"
            />
          </div>

          <div>
            <label htmlFor="settings-country" className={cabinetFieldLabelClasses}>
              {tAccount('country')}
            </label>
            <Input
              id="settings-country"
              type="text"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              maxLength={100}
              disabled={isSaving}
              className="mt-2 w-full rounded-none"
            />
          </div>

          <div>
            <label htmlFor="settings-city" className={cabinetFieldLabelClasses}>
              {tAccount('city')}
            </label>
            <Input
              id="settings-city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={100}
              disabled={isSaving}
              className="mt-2 w-full rounded-none"
            />
          </div>

          <div>
            <label htmlFor="settings-locale" className={cabinetFieldLabelClasses}>
              {tAccount('locale')}
            </label>
            <Select
              value={localePreference}
              onValueChange={(value) => setLocalePreference(value as Locale)}
              disabled={isSaving}
            >
              <SelectTrigger id="settings-locale" className="mt-2 w-full rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((value) => (
                  <SelectItem key={value} value={value}>
                    {tCommon(`locales.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="settings-about" className={cabinetFieldLabelClasses}>
              {tAccount('about')}
            </label>
            <Textarea
              id="settings-about"
              rows={3}
              maxLength={500}
              placeholder={tAccount('aboutPlaceholder')}
              value={about}
              onChange={(event) => setAbout(event.target.value)}
              disabled={isSaving}
              className="mt-2 w-full rounded-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? tAccount('saving') : getButtonLabel(tAccount('save'))}
            {!isSaving ? <ArrowUpRight size={16} aria-hidden /> : null}
          </Button>
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

      <section>
        <h2 className="border-destructive/20 mb-6 border-b pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-destructive">
          {t('dangerSection')}
        </h2>
        <Alert variant="destructive" className="py-4">
          <AlertTitle>{t('deleteAccount')}</AlertTitle>
          <AlertDescription>{t('deleteAccountHint')}</AlertDescription>
          <AlertAction>
            <Button type="button" variant="destructive" size="sm" disabled>
              {getButtonLabel(t('deleteAccountCta'))}
              <ArrowUpRight size={14} aria-hidden />
            </Button>
          </AlertAction>
        </Alert>
      </section>
    </div>
  );
}
