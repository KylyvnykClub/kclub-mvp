import type { PublicBusinessListItemDto, PublicCardVerificationDto } from '@kclub/contracts';

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kylyvnyk.club';
}

export function getFeaturedBusinessGroups(businesses: PublicBusinessListItemDto[]) {
  const top = businesses.filter((business) => business.featuredTop).slice(0, 3);
  const topIds = new Set(top.map((business) => business.id));
  const recommended = businesses
    .filter((business) => business.featuredRecommended && !topIds.has(business.id))
    .slice(0, 3);

  return { top, recommended };
}

export function getTopPartners(
  businesses: PublicBusinessListItemDto[],
): PublicBusinessListItemDto[] {
  const top = businesses.filter((business) => business.featuredTop);
  const topIds = new Set(top.map((business) => business.id));
  const recommended = businesses.filter(
    (business) => business.featuredRecommended && !topIds.has(business.id),
  );

  return [...top, ...recommended];
}

export function getBusinessLocation(business: PublicBusinessListItemDto): string {
  return [business.cityName, business.countryName].filter(Boolean).join(', ');
}

export function getPrimaryBusinessUrl(business: PublicBusinessListItemDto): string | null {
  return business.websiteUrl ?? business.socialUrl ?? null;
}

export function isPublicCardVerificationPiiSafe(card: PublicCardVerificationDto): boolean {
  const keys = Object.keys(card);
  return !keys.some((key) =>
    ['id', 'userId', 'phone', 'email', 'qrPayloadUrl', 'supabaseAuthUserId'].includes(key),
  );
}

export function isPublicBusinessListPiiSafe(business: PublicBusinessListItemDto): boolean {
  const keys = Object.keys(business);
  return !keys.some((key) =>
    [
      'ownerUserId',
      'representativeEmail',
      'representativePhone',
      'internalNotes',
      'status',
    ].includes(key),
  );
}

export function isPublicBusinessDetailPiiSafe(business: Record<string, unknown>): boolean {
  const keys = Object.keys(business);
  return !keys.some((key) =>
    [
      'ownerUserId',
      'representativeEmail',
      'representativePhone',
      'internalNotes',
      'status',
      'privateNotes',
      'userId',
    ].includes(key),
  );
}
