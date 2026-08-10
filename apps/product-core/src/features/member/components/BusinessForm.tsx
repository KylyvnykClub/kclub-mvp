'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CircleAlert,
  CircleCheck,
  FileBadge2,
  ImagePlus,
  LoaderCircle,
  Upload,
} from 'lucide-react';

import {
  MEMBER_API_ROUTES,
  type BusinessVerificationDocumentDto,
  type MemberBusinessProfileDto,
} from '@kclub/contracts';

import { Button, PhoneInput } from '@kclub/ui';

import type { Locale } from '@/i18n/routing';
import { parseAuthResponse } from '@/features/auth/utils/api';
import {
  defaultCountryForLocale,
  renderCountryFlag,
  shadcnPhoneInputClassName,
  shadcnPhonePanelClassName,
  shadcnPhoneTriggerClassName,
} from '@/components/ui/country-flag';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/reui/alert';
import type { CategoryTaxonomyOption, CityTaxonomyOption, TaxonomyOption } from './BusinessPanel';

type BusinessFormProps = {
  locale: Locale;
  business: MemberBusinessProfileDto | null;
  countryOptions: TaxonomyOption[];
  categoryOptions: CategoryTaxonomyOption[];
};

function FormRow({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border px-0 py-5 last:border-b-0 sm:flex-row sm:items-start sm:gap-8">
      <div className="w-full shrink-0 sm:w-44 sm:pt-2.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
          {optional && <span className="ml-1.5 text-xs font-normal text-muted">(optional)</span>}
        </Label>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function BusinessForm({
  locale,
  business,
  countryOptions,
  categoryOptions,
}: BusinessFormProps) {
  const t = useTranslations('member.dashboard.business');
  const tCommon = useTranslations('member.common');

  const [name, setName] = useState(business?.name ?? '');
  const [representativeName, setRepresentativeName] = useState(business?.representativeName ?? '');
  const [representativeEmail, setRepresentativeEmail] = useState(
    business?.representativeEmail ?? '',
  );
  const [representativePhone, setRepresentativePhone] = useState(
    business?.representativePhone ?? '',
  );
  const [countryId, setCountryId] = useState(business?.countryId ?? '');
  const [cityId, setCityId] = useState(business?.cityId ?? '');
  const initialCategory = categoryOptions.find((category) => category.id === business?.categoryId);
  const initialParentCategory = initialCategory?.parentId
    ? categoryOptions.find((category) => category.id === initialCategory.parentId)
    : undefined;
  const [blockId, setBlockId] = useState(
    initialParentCategory?.parentId ??
      (initialCategory?.level === 'CATEGORY' ? initialCategory.parentId : '') ??
      '',
  );
  const [parentCategoryId, setParentCategoryId] = useState(
    initialCategory?.level === 'SUBCATEGORY' ? (initialCategory.parentId ?? '') : '',
  );
  const [categoryId, setCategoryId] = useState(business?.categoryId ?? '');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState(business?.websiteUrl ?? '');
  const [socialUrl, setSocialUrl] = useState(business?.socialUrl ?? '');
  const [briefDescription, setBriefDescription] = useState(business?.briefDescription ?? '');
  const [memberDiscountPercent, setMemberDiscountPercent] = useState<string>(
    business?.memberDiscountPercent != null ? String(business.memberDiscountPercent) : '',
  );
  const [cityOptions, setCityOptions] = useState<CityTaxonomyOption[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [cityLoadError, setCityLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState(business?.coverImageUrl ?? '');
  const [logoUrl, setLogoUrl] = useState(business?.logoUrl ?? '');
  const [verificationDocuments, setVerificationDocuments] = useState<
    BusinessVerificationDocumentDto[]
  >(business?.verificationDocuments ?? []);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const visibleCityOptions = countryId ? cityOptions : [];
  const visibleCityLoadError = countryId ? cityLoadError : null;
  const visibleIsLoadingCities = countryId ? isLoadingCities : false;

  const isEdit = business !== null;
  const blockOptions = categoryOptions.filter((category) => category.level === 'BLOCK');
  const parentCategoryOptions = categoryOptions.filter(
    (category) => category.level === 'CATEGORY' && category.parentId === blockId,
  );
  const subcategoryOptions = categoryOptions.filter(
    (category) => category.level === 'SUBCATEGORY' && category.parentId === parentCategoryId,
  );

  async function handleMediaUpload(kind: 'cover' | 'logo', file: File | null): Promise<void> {
    if (!file || !business) {
      return;
    }

    setIsUploadingMedia(true);
    setMediaError(null);

    try {
      const formData = new FormData();
      formData.append('kind', kind);
      formData.append('file', file);
      const response = await fetch(MEMBER_API_ROUTES.BUSINESS_MEDIA.replace(':id', business.id), {
        method: 'POST',
        body: formData,
      });
      const result = await parseAuthResponse<MemberBusinessProfileDto>(response);

      if (!result.success || !result.data) {
        setMediaError(tCommon('genericError'));
        return;
      }

      if (kind === 'cover') {
        setCoverImageUrl(result.data.coverImageUrl ?? '');
      } else {
        setLogoUrl(result.data.logoUrl ?? '');
      }
    } catch {
      setMediaError(tCommon('genericError'));
    } finally {
      setIsUploadingMedia(false);
    }
  }

  async function handleDocumentUpload(file: File | null): Promise<void> {
    if (!file || !business) {
      return;
    }

    setIsUploadingDocument(true);
    setDocumentError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(
        MEMBER_API_ROUTES.BUSINESS_DOCUMENTS.replace(':id', business.id),
        {
          method: 'POST',
          body: formData,
        },
      );
      const result = await parseAuthResponse<BusinessVerificationDocumentDto>(response);

      if (!result.success || !result.data) {
        setDocumentError(tCommon('genericError'));
        return;
      }

      setVerificationDocuments((current) => [result.data!, ...current]);
    } catch {
      setDocumentError(tCommon('genericError'));
    } finally {
      setIsUploadingDocument(false);
    }
  }

  useEffect(() => {
    if (!countryId) {
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    async function loadCities(): Promise<void> {
      setIsLoadingCities(true);
      setCityLoadError(null);
      setCityOptions([]);

      try {
        const response = await fetch(
          `${MEMBER_API_ROUTES.TAXONOMY_CITIES}?countryId=${encodeURIComponent(countryId)}`,
          { signal: controller.signal },
        );
        const result = await parseAuthResponse<CityTaxonomyOption[]>(response);

        if (!isActive) return;

        if (!result.success || !result.data) {
          setCityLoadError(t('citiesLoadError'));
          return;
        }

        setCityOptions(result.data);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          return;
        }

        if (isActive) {
          setCityLoadError(t('citiesLoadError'));
        }
      } finally {
        if (isActive) {
          setIsLoadingCities(false);
        }
      }
    }

    void loadCities();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [countryId, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const url = isEdit
        ? MEMBER_API_ROUTES.BUSINESS_DETAIL.replace(':id', business!.id)
        : MEMBER_API_ROUTES.BUSINESSES;

      const method = isEdit ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        name,
        representativeName,
        representativeEmail,
        representativePhone,
        countryId,
        cityId,
        briefDescription,
      };

      if (categoryId === '__other__') {
        body.customCategoryName = customCategoryName.trim();
      } else if (categoryId) {
        body.categoryId = categoryId;
      }
      if (countryId) body.countryId = countryId;
      if (cityId) body.cityId = cityId;

      if (websiteUrl) body.websiteUrl = websiteUrl;
      if (socialUrl) body.socialUrl = socialUrl;
      body.memberDiscountPercent = memberDiscountPercent ? Number(memberDiscountPercent) : null;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await parseAuthResponse<MemberBusinessProfileDto>(response);

      if (!result.success) {
        const msg = result.errorCode
          ? t(`errors.${result.errorCode}`, { defaultValue: tCommon('genericError') })
          : tCommon('genericError');
        setError(msg);
        return;
      }

      setSuccess(true);
    } catch {
      setError(tCommon('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive" className="mb-6 rounded-none">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6 rounded-none">
          <CircleCheck aria-hidden="true" />
          <AlertDescription>{isEdit ? t('editSuccess') : t('submitSuccess')}</AlertDescription>
        </Alert>
      )}

      {mediaError && (
        <Alert variant="destructive" className="mb-6 rounded-none">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{mediaError}</AlertDescription>
        </Alert>
      )}

      {documentError && (
        <Alert variant="destructive" className="mb-6 rounded-none">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{documentError}</AlertDescription>
        </Alert>
      )}

      <div className="divide-y-0">
        <FormRow label={t('nameLabel')} htmlFor="biz-name">
          <Input
            id="biz-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="w-full rounded-none"
          />
        </FormRow>

        <FormRow label={t('categoryLabel')} htmlFor="biz-category">
          <div className="space-y-3">
            <Select
              value={blockId}
              onValueChange={(value) => {
                setBlockId(value ?? '');
                setParentCategoryId('');
                setCategoryId('');
                setCustomCategoryName('');
              }}
              required
            >
              <SelectTrigger id="biz-category" className="w-full rounded-none">
                <SelectValue placeholder={t('categoryBlockPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {blockOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={parentCategoryId}
              onValueChange={(value) => {
                setParentCategoryId(value ?? '');
                setCategoryId('');
                setCustomCategoryName('');
              }}
              disabled={!blockId}
              required
            >
              <SelectTrigger className="w-full rounded-none">
                <SelectValue placeholder={t('categoryParentPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {parentCategoryOptions.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={categoryId}
              onValueChange={(value) => {
                setCategoryId(value ?? '');
                setCustomCategoryName('');
              }}
              disabled={!parentCategoryId}
              required
            >
              <SelectTrigger className="w-full rounded-none">
                <SelectValue placeholder={t('categorySubcategoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {subcategoryOptions.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
                <SelectItem value="__other__">{t('categoryOther')}</SelectItem>
              </SelectContent>
            </Select>
            {categoryId === '__other__' && (
              <Input
                type="text"
                required
                minLength={2}
                maxLength={120}
                placeholder={t('customCategoryNamePlaceholder')}
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                className="mt-3 w-full rounded-none"
              />
            )}
          </div>
        </FormRow>

        <FormRow label={t('representativeNameLabel')} htmlFor="biz-rep-name">
          <Input
            id="biz-rep-name"
            type="text"
            value={representativeName}
            onChange={(e) => setRepresentativeName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="w-full rounded-none"
          />
        </FormRow>

        <FormRow label={t('representativeEmailLabel')} htmlFor="biz-rep-email">
          <Input
            id="biz-rep-email"
            type="email"
            value={representativeEmail}
            onChange={(e) => setRepresentativeEmail(e.target.value)}
            required
            className="w-full rounded-none"
          />
        </FormRow>

        <FormRow label={t('representativePhoneLabel')}>
          <PhoneInput
            defaultCountry={defaultCountryForLocale(locale)}
            renderFlag={renderCountryFlag}
            value={representativePhone}
            onChange={(value) => setRepresentativePhone(value)}
            required
            inputClassName={shadcnPhoneInputClassName}
            triggerClassName={shadcnPhoneTriggerClassName}
            panelClassName={shadcnPhonePanelClassName}
          />
        </FormRow>

        <FormRow label={t('countryLabel')} htmlFor="biz-country">
          <Select
            value={countryId}
            onValueChange={(value) => {
              setCountryId(value ?? '');
              setCityId('');
            }}
            required
          >
            <SelectTrigger id="biz-country" className="w-full rounded-none">
              <SelectValue placeholder={t('selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {countryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        <FormRow label={t('cityLabel')} htmlFor="biz-city">
          <Select
            value={cityId}
            onValueChange={(value) => setCityId(value ?? '')}
            disabled={!countryId || visibleIsLoadingCities}
            required
          >
            <SelectTrigger id="biz-city" className="w-full rounded-none">
              <SelectValue
                placeholder={visibleIsLoadingCities ? t('citiesLoading') : t('selectPlaceholder')}
              />
            </SelectTrigger>
            <SelectContent>
              {visibleCityOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {visibleCityLoadError && (
            <p className="mt-2 text-xs text-destructive">{visibleCityLoadError}</p>
          )}
        </FormRow>

        <FormRow label={t('websiteUrlLabel')} htmlFor="biz-website" optional>
          <Input
            id="biz-website"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full rounded-none"
          />
        </FormRow>

        <FormRow label={t('socialUrlLabel')} htmlFor="biz-social" optional>
          <Input
            id="biz-social"
            type="url"
            value={socialUrl}
            onChange={(e) => setSocialUrl(e.target.value)}
            className="w-full rounded-none"
          />
        </FormRow>

        {isEdit && (
          <FormRow label={t('publicPhotosLabel')}>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('publicPhotosHint')}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <BusinessMediaField
                  id="biz-cover-image"
                  label={t('coverImageLabel')}
                  requirementsLabel={t('imageRequirements')}
                  uploadingLabel={t('imageUploading')}
                  imageUrl={coverImageUrl}
                  isUploading={isUploadingMedia}
                  onFileChange={(file) => handleMediaUpload('cover', file)}
                />
                <BusinessMediaField
                  id="biz-logo-image"
                  label={t('logoImageLabel')}
                  requirementsLabel={t('imageRequirements')}
                  uploadingLabel={t('imageUploading')}
                  imageUrl={logoUrl}
                  isUploading={isUploadingMedia}
                  onFileChange={(file) => handleMediaUpload('logo', file)}
                />
              </div>
            </div>
          </FormRow>
        )}

        {isEdit && (
          <FormRow label={t('verificationDocumentsLabel')}>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('verificationDocumentsHint')}</p>
              <div className="border border-border p-4">
                <Label
                  htmlFor="biz-verification-documents"
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <Upload aria-hidden="true" className="size-4 text-accent" />
                  {t('verificationDocumentsUploadLabel')}
                </Label>
                <Input
                  id="biz-verification-documents"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  disabled={isUploadingDocument}
                  onChange={(event) => {
                    void handleDocumentUpload(event.target.files?.item(0) ?? null);
                    event.currentTarget.value = '';
                  }}
                  className="mt-3 w-full rounded-none"
                />
                <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  {isUploadingDocument && (
                    <LoaderCircle aria-hidden="true" className="size-3 animate-spin" />
                  )}
                  {isUploadingDocument
                    ? t('verificationDocumentsUploading')
                    : t('verificationDocumentsRequirements')}
                </p>
              </div>

              <div className="space-y-3">
                {verificationDocuments.length === 0 ? (
                  <div className="border border-dashed border-border p-4 text-sm text-muted-foreground">
                    {t('verificationDocumentsEmpty')}
                  </div>
                ) : (
                  verificationDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-3 border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileBadge2 aria-hidden="true" className="size-4 text-accent" />
                          <p className="truncate text-sm font-medium text-foreground">
                            {document.fileName}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatFileSize(document.fileSizeBytes)} ·{' '}
                          {new Date(document.createdAt).toLocaleDateString(locale)}
                        </p>
                        {document.rejectionReason && (
                          <p className="mt-2 text-xs text-destructive">
                            {t('verificationDocumentsRejectedReason', {
                              reason: document.rejectionReason,
                            })}
                          </p>
                        )}
                      </div>
                      <DocumentStatusChip document={document} t={t} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </FormRow>
        )}

        <FormRow label={t('briefDescriptionLabel')} htmlFor="biz-desc" optional>
          <Textarea
            id="biz-desc"
            value={briefDescription ?? ''}
            onChange={(e) => setBriefDescription(e.target.value)}
            maxLength={2000}
            className="w-full rounded-none"
          />
        </FormRow>

        <FormRow label={t('memberDiscountLabel')} htmlFor="biz-discount" optional>
          <Input
            id="biz-discount"
            type="number"
            min={1}
            max={100}
            placeholder={t('memberDiscountPlaceholder')}
            value={memberDiscountPercent}
            onChange={(e) => setMemberDiscountPercent(e.target.value)}
            className="w-full rounded-none"
          />
        </FormRow>
      </div>

      <div className="flex justify-end pt-6">
        <Button color="brand" size="md" type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon('saving') : isEdit ? t('editSubmit') : t('submitCta')}
        </Button>
      </div>
    </form>
  );
}

function DocumentStatusChip({
  document,
  t,
}: {
  document: BusinessVerificationDocumentDto;
  t: ReturnType<typeof useTranslations>;
}): React.ReactElement {
  const statusClassName =
    document.status === 'APPROVED'
      ? 'border border-green-500/30 bg-green-500/10 text-green-500'
      : document.status === 'REJECTED'
        ? 'border border-red-500/30 bg-red-500/10 text-red-500'
        : 'border border-yellow-500/30 bg-yellow-500/10 text-yellow-500';

  const statusLabel =
    document.status === 'APPROVED'
      ? t('verificationDocumentsStatusApproved')
      : document.status === 'REJECTED'
        ? t('verificationDocumentsStatusRejected')
        : t('verificationDocumentsStatusPending');

  return (
    <span
      className={`${statusClassName} inline-flex w-fit items-center rounded-none px-3 py-1 text-xs font-medium`}
    >
      {statusLabel}
    </span>
  );
}

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BusinessMediaField({
  id,
  imageUrl,
  isUploading,
  label,
  onFileChange,
  requirementsLabel,
  uploadingLabel,
}: {
  id: string;
  imageUrl: string;
  isUploading: boolean;
  label: string;
  onFileChange: (file: File | null) => void;
  requirementsLabel: string;
  uploadingLabel: string;
}): React.ReactElement {
  return (
    <div className="space-y-3 border border-border p-4">
      <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-foreground">
        <ImagePlus aria-hidden="true" className="size-4 text-accent" />
        {label}
      </Label>
      {imageUrl && (
        // Supabase storage hosts are deployment-configured, so they cannot be safely whitelisted here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-28 w-full object-cover" />
      )}
      <Input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={isUploading}
        onChange={(event) => onFileChange(event.target.files?.item(0) ?? null)}
        className="w-full rounded-none"
      />
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {isUploading && <LoaderCircle aria-hidden="true" className="size-3 animate-spin" />}
        {isUploading ? uploadingLabel : requirementsLabel}
      </p>
    </div>
  );
}
