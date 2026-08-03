export const PUBLIC_BUSINESS_DTO_KEYS = [
  'id',
  'slug',
  'name',
  'categoryId',
  'blockName',
  'blockSlug',
  'categoryName',
  'categorySlug',
  'subcategoryName',
  'subcategorySlug',
  'countryName',
  'cityName',
  'briefDescription',
  'websiteUrl',
  'socialUrl',
  'featuredTop',
  'featuredRecommended',
  'memberDiscountPercent',
  'discountMuted',
  'coverImageUrl',
  'logoUrl',
  'description',
  'representativeName',
  'publishedAt',
] as const;

export const ADMIN_BUSINESS_ONLY_KEYS = [
  'ownerUserId',
  'status',
  'representativeEmail',
  'representativePhone',
  'rejectionReason',
  'internalNotes',
  'approvedAt',
  'hiddenAt',
  'createdAt',
  'updatedAt',
] as const;

export type PublicBusinessDtoKey = (typeof PUBLIC_BUSINESS_DTO_KEYS)[number];
export type AdminBusinessOnlyKey = (typeof ADMIN_BUSINESS_ONLY_KEYS)[number];

export function isPublicBusinessDtoKey(key: string): key is PublicBusinessDtoKey {
  return (PUBLIC_BUSINESS_DTO_KEYS as readonly string[]).includes(key);
}
