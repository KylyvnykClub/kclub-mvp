'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';

import type { CurrentMemberProfileDto } from '@kclub/contracts';
import { MEMBER_API_ROUTES } from '@kclub/contracts';
import { Spinner } from '@kclub/ui';

import type { Locale } from '@/i18n/routing';
import { locales } from '@/i18n/routing';
import { parseAuthResponse } from '@/features/auth/utils/api';
import { KylyvnykClubCard } from '@/features/member/components/KylyvnykClubCard';
import {
  cabinetContentClasses,
  cabinetFieldLabelClasses,
} from '@/features/member/components/cabinet/styles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/reui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AccountPanelProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  cardNumber?: string | null;
};

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

function getPlanLabel(tier: CurrentMemberProfileDto['membershipTier']): string {
  return tier === 'VIP' ? 'VIP' : 'MEMBER';
}

export function AccountPanel({ locale, profile, cardNumber }: AccountPanelProps) {
  const t = useTranslations('member.dashboard.account');
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

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const memberName = displayName || profile.displayName || profile.phone;
  const regDate = new Date(profile.createdAt).toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

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
        toast.error(t('avatarUploadError'));
        return;
      }

      setAvatarUrl(result.data.avatarUrl ?? '');
      router.refresh();
    } catch {
      toast.error(t('avatarUploadError'));
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
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
        toast.error(t('saveError'));
        return;
      }

      toast.success(t('saveSuccess'));
      router.refresh();
    } catch {
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cabinetContentClasses}>
      <div className="mb-10 flex flex-col gap-6 border-b border-border pb-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleAvatarClick}
              aria-label={t('avatar')}
              className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full"
            >
              <Avatar
                className="border-accent/25 border bg-surface-muted"
                style={{ width: '5rem', height: '5rem' }}
              >
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={memberName} /> : null}
                <AvatarFallback className="bg-transparent text-2xl font-bold text-accent">
                  {getInitials(displayName || profile.displayName, profile.phone)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
                {isUploadingAvatar ? (
                  <Spinner size={18} className="text-white" />
                ) : (
                  <Camera size={18} className="text-white" />
                )}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="min-w-0 pt-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
              <span className="text-2xl font-semibold text-foreground">{memberName}</span>
              <Badge variant="outline" size="sm">
                {getPlanLabel(profile.membershipTier)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{t('memberSince', { date: regDate })}</p>
          </div>
        </div>

        <KylyvnykClubCard
          name={memberName}
          status={cardNumber ?? `${getPlanLabel(profile.membershipTier)} MEMBER`}
          idNumber={profile.id}
          className="shrink-0"
        />
      </div>

      <div className="mb-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="account-display-name" className={cabinetFieldLabelClasses}>
            {t('displayName')}
          </label>
          <Input
            id="account-display-name"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={100}
            disabled={isSaving}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="account-phone" className={cabinetFieldLabelClasses}>
            {t('phone')}
          </label>
          <Input
            id="account-phone"
            type="text"
            value={profile.phone}
            readOnly
            className="w-full cursor-default bg-background text-muted-foreground"
          />
        </div>

        <div>
          <label htmlFor="account-country" className={cabinetFieldLabelClasses}>
            {t('country')}
          </label>
          <Input
            id="account-country"
            type="text"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            maxLength={100}
            disabled={isSaving}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="account-city" className={cabinetFieldLabelClasses}>
            {t('city')}
          </label>
          <Input
            id="account-city"
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            maxLength={100}
            disabled={isSaving}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="account-locale" className={cabinetFieldLabelClasses}>
            {t('locale')}
          </label>
          <Select
            value={localePreference}
            onValueChange={(value) => setLocalePreference(value as Locale)}
            disabled={isSaving}
          >
            <SelectTrigger id="account-locale" className="w-full">
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

        <div>
          <label htmlFor="account-reg-date" className={cabinetFieldLabelClasses}>
            {t('joined')}
          </label>
          <Input
            id="account-reg-date"
            type="text"
            value={regDate}
            readOnly
            className="w-full cursor-default bg-background text-muted"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="account-about" className={cabinetFieldLabelClasses}>
            {t('about')}
          </label>
          <Textarea
            id="account-about"
            rows={3}
            maxLength={500}
            placeholder={t('aboutPlaceholder')}
            value={about}
            onChange={(event) => setAbout(event.target.value)}
            disabled={isSaving}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <Button type="button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}
