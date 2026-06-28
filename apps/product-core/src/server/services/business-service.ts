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

import { AppError } from '@/server/errors';
import { getDbClient, schema } from '@kclub/database';
import { eq, and, ne } from 'drizzle-orm';
import { createDbAuditService } from '@/server/audit';
import type { RequestContext } from '@/server/context';

const auditService = createDbAuditService();

export const PUBLIC_BUSINESS_VISIBILITY_FILTER = { status: 'PUBLISHED' as const };

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
    where: (bp, { eq, and, ne }) => and(eq(bp.userId, userId), ne(bp.status, 'REJECTED')),
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
    where: (c, { eq }) => eq(c.id, input.categoryId),
  });

  if (!category || !category.isActive) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Category not found or inactive',
      status: 404,
    });
  }

  if (category.isHighRisk) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_CATEGORY_HIGH_RISK,
      message: 'Category is high risk and requires manual application',
      status: 403,
    });
  }

  // 4. City belongs to country
  const city = await db.query.cities.findFirst({
    where: (c, { eq }) => eq(c.id, input.cityId),
  });

  if (!city || city.countryId !== input.countryId) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_CITY_COUNTRY_MISMATCH,
      message: 'City does not belong to the specified country',
      status: 400,
    });
  }

  const slug = generateSlug(input.name);

  const [inserted] = await db.insert(schema.businessProfiles).values({
    userId,
    slug,
    name: input.name,
    representativeName: input.representativeName,
    representativeEmail: input.representativeEmail,
    representativePhone: input.representativePhone,
    countryId: input.countryId,
    cityId: input.cityId,
    categoryId: input.categoryId,
    websiteUrl: input.websiteUrl ?? null,
    socialUrl: input.socialUrl ?? null,
    briefDescription: input.briefDescription ?? null,
    status: 'UNDER_REVIEW',
  }).returning();

  const newBusiness = await db.query.businessProfiles.findFirst({
    where: (bp, { eq }) => eq(bp.id, inserted.id),
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
    where: (bp, { eq }) => eq(bp.id, businessId),
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  if (business.userId !== userId) {
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
  if (input.categoryId && input.categoryId !== business.categoryId) {
    const category = await db.query.categories.findFirst({ where: (c, { eq }) => eq(c.id, input.categoryId!) });
    if (!category || !category.isActive) {
      throw new AppError({
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Category not found',
        status: 404,
      });
    }
    if (category.isHighRisk) {
      throw new AppError({
        code: ERROR_CODES.BUSINESS_CATEGORY_HIGH_RISK,
        message: 'Category is high risk',
        status: 403,
      });
    }
  }

  if (input.cityId || input.countryId) {
    const targetCityId = input.cityId ?? business.cityId;
    const targetCountryId = input.countryId ?? business.countryId;
    const city = await db.query.cities.findFirst({ where: (c, { eq }) => eq(c.id, targetCityId) });
    if (!city || city.countryId !== targetCountryId) {
      throw new AppError({
        code: ERROR_CODES.BUSINESS_CITY_COUNTRY_MISMATCH,
        message: 'City does not belong to the specified country',
        status: 400,
      });
    }
  }

  const dataToUpdate: any = {};
  
  if (input.name !== undefined) dataToUpdate.name = input.name;
  if (input.briefDescription !== undefined) dataToUpdate.briefDescription = input.briefDescription;
  if (input.websiteUrl !== undefined) dataToUpdate.websiteUrl = input.websiteUrl;
  if (input.socialUrl !== undefined) dataToUpdate.socialUrl = input.socialUrl;
  if (input.categoryId !== undefined) dataToUpdate.categoryId = input.categoryId;
  if (input.cityId !== undefined) dataToUpdate.cityId = input.cityId;
  if (input.countryId !== undefined) dataToUpdate.countryId = input.countryId;
  if (input.representativeName !== undefined) dataToUpdate.representativeName = input.representativeName;
  if (input.representativeEmail !== undefined) dataToUpdate.representativeEmail = input.representativeEmail;
  if (input.representativePhone !== undefined) dataToUpdate.representativePhone = input.representativePhone;

  // Always reset to UNDER_REVIEW so admin re-approves after any edit
  dataToUpdate.status = 'UNDER_REVIEW';
  dataToUpdate.approvedAt = null;

  await db.update(schema.businessProfiles)
    .set(dataToUpdate)
    .where(eq(schema.businessProfiles.id, businessId));

  const updatedBusiness = await db.query.businessProfiles.findFirst({
    where: (bp, { eq }) => eq(bp.id, businessId),
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
    where: (bp, { eq }) => eq(bp.userId, userId),
    with: { category: true, country: true, city: true },
    orderBy: (bp, { desc }) => [desc(bp.createdAt)],
  });

  return businesses.map(toMemberBusinessProfileDto);
}

export async function getBusinessDetail(
  businessId: string,
  userId?: string,
): Promise<PublicBusinessDetailDto | MemberBusinessProfileDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: (bp, { eq }) => eq(bp.id, businessId),
    with: { category: true, country: true, city: true },
  });

  if (!business) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business not found',
      status: 404,
    });
  }

  const isOwner = userId === business.userId;

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
    where: (bp, { eq }) => eq(bp.status, 'PUBLISHED'),
    with: { category: true, country: true, city: true },
    orderBy: (bp, { desc }) => [desc(bp.featuredTop), desc(bp.featuredRecommended), desc(bp.publishedAt)],
  });

  return businesses.map(toPublicBusinessListItemDto);
}

export async function getPublicBusinessBySlug(slug: string): Promise<PublicBusinessDetailDto> {
  const db = getDbClient();
  const business = await db.query.businessProfiles.findFirst({
    where: (bp, { eq, and }) => and(eq(bp.status, 'PUBLISHED'), eq(bp.slug, slug)),
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
    briefDescription: business.briefDescription,
    websiteUrl: business.websiteUrl,
    socialUrl: business.socialUrl,
    featuredTop: business.featuredTop,
    featuredRecommended: business.featuredRecommended,
    memberDiscountPercent: business.memberDiscountPercent ?? null,
  };
}

export function toPublicBusinessDetailDto(business: any): PublicBusinessDetailDto {
  return {
    ...toPublicBusinessListItemDto(business),
    description: business.description,
    representativeName: business.representativeName,
    publishedAt: business.publishedAt?.toISOString() ?? null,
  };
}

export function toMemberBusinessProfileDto(business: any): MemberBusinessProfileDto {
  return {
    ...toPublicBusinessDetailDto(business),
    status: business.status as BusinessStatus,
    representativeEmail: business.representativeEmail,
    representativePhone: business.representativePhone,
    rejectionReason: business.rejectionReason,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
  };
}
