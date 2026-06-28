import {
  ERROR_CODES,
  type BusinessStatus,
  type MemberBusinessProfileDto,
  type PublicBusinessDetailDto,
  type PublicBusinessListItemDto,
} from '@kclub/contracts';
import type {
  BusinessProfileSubmitInput,
  BusinessProfileEditableFieldsInput,
} from '@kclub/validation';

import { eq, desc, and, ne } from 'drizzle-orm';
import { AppError } from '@/server/errors';
import { getDbClient, schema } from '@/server/db';
import { createDbAuditService } from '@/server/audit';
import type { RequestContext } from '@/server/context';

const auditService = createDbAuditService();

export const PUBLIC_BUSINESS_VISIBILITY_FILTER = eq(schema.businessProfiles.status, 'PUBLISHED');

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9а-яёіїєґ]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const uniqueId = Math.random().toString(36).substring(2, 6);
  return `${base}-${uniqueId}`;
}

export async function submitBusiness(
  input: BusinessProfileSubmitInput,
  context: RequestContext,
): Promise<MemberBusinessProfileDto> {
  const db = getDbClient();
  const userId = context.actor?.kind === 'member' ? context.actor.userId : null;

  if (!userId) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'Authentication required',
      status: 401,
    });
  }

  // Check duplicate active business
  const existingActiveBusiness = await db.query.businessProfiles.findFirst({
    where: and(
      eq(schema.businessProfiles.user_id, userId),
      ne(schema.businessProfiles.status, 'REJECTED')
    ),
  });

  if (existingActiveBusiness) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_ALREADY_ACTIVE,
      message: 'User already has an active or pending business profile',
      status: 409,
    });
  }

  // 3. Category exists, is active, not high risk
  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.id, input.categoryId),
  });

  if (!category || !category.is_active) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Category not found or inactive',
      status: 404,
    });
  }

  if (category.is_high_risk) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_CATEGORY_HIGH_RISK,
      message: 'Category is high risk and requires manual application',
      status: 403,
    });
  }

  // 4. City belongs to country
  const city = await db.query.cities.findFirst({
    where: eq(schema.cities.id, input.cityId),
  });

  if (!city || city.country_id !== input.countryId) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_CITY_COUNTRY_MISMATCH,
      message: 'City does not belong to the specified country',
      status: 400,
    });
  }

  const slug = generateSlug(input.name);

  const [newBusinessData] = await db.insert(schema.businessProfiles).values({
    user_id: userId,
    slug,
    name: input.name,
    representative_name: input.representativeName,
    representative_email: input.representativeEmail,
    representative_phone: input.representativePhone,
    country_id: input.countryId,
    city_id: input.cityId,
    category_id: input.categoryId,
    website_url: input.websiteUrl ?? null,
    social_url: input.socialUrl ?? null,
    brief_description: input.briefDescription ?? null,
    status: 'UNDER_REVIEW',
  }).returning();

  const newBusiness = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, newBusinessData.id),
    with: {
      category: true,
      country: true,
      city: true,
    },
  });

  await auditService.log(
    {
      action: 'BUSINESS_SUBMITTED',
      entityType: 'BusinessProfile',
      entityId: newBusiness!.id,
      after: { status: newBusiness!.status },
    },
    context,
  );

  return toMemberBusinessProfileDto(newBusiness);
}

export async function updateBusiness(
  businessId: string,
  input: BusinessProfileEditableFieldsInput,
  context: RequestContext,
): Promise<MemberBusinessProfileDto> {
  const db = getDbClient();
  const userId = context.actor?.kind === 'member' ? context.actor.userId : null;

  if (!userId) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'Authentication required',
      status: 401,
    });
  }

  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (business.user_id !== userId) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'You do not have permission to edit this business',
      status: 403,
    });
  }

  if (business.status === 'HIDDEN') {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_INVALID_STATUS_TRANSITION,
      message: 'Cannot edit a hidden business',
      status: 409,
    });
  }

  // Optional category/city checks
  if (input.categoryId && input.categoryId !== business.category_id) {
    const category = await db.query.categories.findFirst({
      where: eq(schema.categories.id, input.categoryId)
    });
    if (!category || !category.is_active) {
      throw new AppError({
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Category not found',
        status: 404,
      });
    }
    if (category.is_high_risk) {
      throw new AppError({
        code: ERROR_CODES.BUSINESS_CATEGORY_HIGH_RISK,
        message: 'Category is high risk',
        status: 403,
      });
    }
  }

  if (input.cityId || input.countryId) {
    const targetCityId = input.cityId ?? business.city_id;
    const targetCountryId = input.countryId ?? business.country_id;
    const city = await db.query.cities.findFirst({
      where: eq(schema.cities.id, targetCityId)
    });
    if (!city || city.country_id !== targetCountryId) {
      throw new AppError({
        code: ERROR_CODES.BUSINESS_CITY_COUNTRY_MISMATCH,
        message: 'City does not belong to the specified country',
        status: 400,
      });
    }
  }

  const dataToUpdate: any = {
    ...input,
    brief_description: input.briefDescription,
    website_url: input.websiteUrl,
    social_url: input.socialUrl,
  };

  delete dataToUpdate.briefDescription;
  delete dataToUpdate.websiteUrl;
  delete dataToUpdate.socialUrl;
  delete dataToUpdate.categoryId;
  delete dataToUpdate.cityId;
  delete dataToUpdate.countryId;
  delete dataToUpdate.representativeName;
  delete dataToUpdate.representativeEmail;
  delete dataToUpdate.representativePhone;

  if (input.categoryId !== undefined) dataToUpdate.category_id = input.categoryId;
  if (input.cityId !== undefined) dataToUpdate.city_id = input.cityId;
  if (input.countryId !== undefined) dataToUpdate.country_id = input.countryId;
  if (input.representativeName !== undefined)
    dataToUpdate.representative_name = input.representativeName;
  if (input.representativeEmail !== undefined)
    dataToUpdate.representative_email = input.representativeEmail;
  if (input.representativePhone !== undefined)
    dataToUpdate.representative_phone = input.representativePhone;

  // Always reset to UNDER_REVIEW so admin re-approves after any edit
  dataToUpdate.status = 'UNDER_REVIEW';
  dataToUpdate.approved_at = null;

  await db.update(schema.businessProfiles)
    .set(dataToUpdate)
    .where(eq(schema.businessProfiles.id, businessId));

  const updatedBusiness = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: { category: true, country: true, city: true },
  });

  await auditService.log(
    {
      action: 'BUSINESS_UPDATED',
      entityType: 'BusinessProfile',
      entityId: updatedBusiness!.id,
      before: { status: business.status },
      after: { status: updatedBusiness!.status },
    },
    context,
  );

  return toMemberBusinessProfileDto(updatedBusiness);
}

export async function getOwnBusinesses(userId: string): Promise<MemberBusinessProfileDto[]> {
  const db = getDbClient();
  const businesses = await db.query.businessProfiles.findMany({
    where: eq(schema.businessProfiles.user_id, userId),
    with: { category: true, country: true, city: true },
    orderBy: [desc(schema.businessProfiles.created_at)],
  });

  return businesses.map(toMemberBusinessProfileDto);
}

export async function getBusinessDetail(
  businessId: string,
  userId?: string,
): Promise<PublicBusinessDetailDto | MemberBusinessProfileDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: { category: true, country: true, city: true },
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  const isOwner = userId === business.user_id;

  if (isOwner) {
    return toMemberBusinessProfileDto(business);
  }

  if (business.status !== 'PUBLISHED') {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found or not published',
      status: 404,
    });
  }

  return toPublicBusinessDetailDto(business);
}

export async function getPublicBusinesses(): Promise<PublicBusinessListItemDto[]> {
  const db = getDbClient();
  const businesses = await db.query.businessProfiles.findMany({
    where: PUBLIC_BUSINESS_VISIBILITY_FILTER,
    with: { category: true, country: true, city: true },
    orderBy: [
      desc(schema.businessProfiles.featured_top),
      desc(schema.businessProfiles.featured_recommended),
      desc(schema.businessProfiles.published_at),
    ],
  });

  return businesses.map(toPublicBusinessListItemDto);
}

export async function getPublicBusinessBySlug(slug: string): Promise<PublicBusinessDetailDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: and(PUBLIC_BUSINESS_VISIBILITY_FILTER, eq(schema.businessProfiles.slug, slug)),
    with: { category: true, country: true, city: true },
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found or not published',
      status: 404,
    });
  }

  return toPublicBusinessDetailDto(business);
}

export function toPublicBusinessListItemDto(business: any): PublicBusinessListItemDto {
  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    categoryName: business.category.name,
    countryName: business.country.name,
    cityName: business.city.name,
    briefDescription: business.brief_description,
    websiteUrl: business.website_url,
    socialUrl: business.social_url,
    featuredTop: business.featured_top,
    featuredRecommended: business.featured_recommended,
    memberDiscountPercent: business.member_discount_percent ?? null,
  };
}

export function toPublicBusinessDetailDto(business: any): PublicBusinessDetailDto {
  return {
    ...toPublicBusinessListItemDto(business),
    description: business.description,
    representativeName: business.representative_name,
    publishedAt: business.published_at?.toISOString() ?? null,
  };
}

export function toMemberBusinessProfileDto(business: any): MemberBusinessProfileDto {
  return {
    ...toPublicBusinessDetailDto(business),
    status: business.status as BusinessStatus,
    representativeEmail: business.representative_email,
    representativePhone: business.representative_phone,
    rejectionReason: business.rejection_reason,
    createdAt: business.created_at.toISOString(),
    updatedAt: business.updated_at.toISOString(),
  };
}
