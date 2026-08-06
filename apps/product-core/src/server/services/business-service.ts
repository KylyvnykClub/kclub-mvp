import {
  ERROR_CODES,
  type BusinessReviewReserveCheckoutDto,
  type BusinessStatus,
  type Locale,
  type MemberBusinessProfileDto,
  type PublicBusinessDetailDto,
  type PublicBusinessListItemDto,
} from '@kclub/contracts';
import type {
  BusinessProfileSubmitInput,
  BusinessProfileEditableFieldsInput,
} from '@kclub/validation';

import { eq, desc, and, ne, ilike } from 'drizzle-orm';
import type Stripe from 'stripe';

import { AppError } from '@/server/errors';
import { getDbClient, schema } from '@/server/db';
import { createDbAuditService } from '@/server/audit';
import type { RequestContext } from '@/server/context';
import { createRequestContext } from '@/server/context';
import { getStripeClient } from '@/server/stripe/client';
import { rethrowStripeCheckoutError } from '@/server/stripe/errors';

const auditService = createDbAuditService();

export const PUBLIC_BUSINESS_VISIBILITY_FILTER = eq(schema.businessProfiles.status, 'PUBLISHED');
const BUSINESS_REVIEW_RESERVE_AMOUNT = 1999;
const BUSINESS_REVIEW_RESERVE_CURRENCY = 'usd';
const BUSINESS_REVIEW_RESERVE_PRODUCT_NAME = 'Business Review Reservation';

const CATEGORY_WITH_PARENTS = {
  with: { parent: { with: { parent: true } } },
} as const;

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9а-яёіїєґ]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const uniqueId = Math.random().toString(36).substring(2, 6);
  return `${base}-${uniqueId}`;
}

function normalizeAppUrl(url: string): string {
  const stripped = url.replace(/\/+$/, '');
  return stripped.replace(/\/(en|ru|uk)$/, '');
}

function buildBusinessReviewSuccessUrl(appUrl: string, locale: Locale): string {
  return `${normalizeAppUrl(appUrl)}/${locale}/m/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
}

function buildBusinessReviewCancelUrl(appUrl: string, locale: Locale): string {
  return `${normalizeAppUrl(appUrl)}/${locale}/m/checkout/cancel`;
}

function buildBusinessReviewMetadata(
  userId: string,
  pendingSubmissionId: string,
): Record<string, string> {
  return {
    type: 'business_review_reserve',
    userId,
    pendingSubmissionId,
  };
}

async function resolveCustomCategory(customName: string): Promise<string> {
  const db = getDbClient();

  const existing = await db.query.categories.findFirst({
    where: ilike(schema.categories.name, customName),
  });
  if (existing) return existing.id;

  const slug = customName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const slugExists = await db.query.categories.findFirst({
    where: eq(schema.categories.slug, slug),
  });
  const finalSlug = slugExists ? `${slug}-${Math.random().toString(36).substring(2, 6)}` : slug;

  const [newCategory] = await db
    .insert(schema.categories)
    .values({
      name: customName,
      slug: finalSlug,
      is_high_risk: false,
      is_active: true,
      is_custom: true,
    })
    .returning();
  return newCategory!.id;
}

async function validateBusinessSubmitInputForUser(
  input: BusinessProfileSubmitInput,
  userId: string,
): Promise<string> {
  const db = getDbClient();

  const existingActiveBusiness = await db.query.businessProfiles.findFirst({
    where: and(
      eq(schema.businessProfiles.user_id, userId),
      ne(schema.businessProfiles.status, 'REJECTED'),
    ),
  });

  if (existingActiveBusiness) {
    throw new AppError({
      code: ERROR_CODES.BUSINESS_ALREADY_ACTIVE,
      message: 'User already has an active or pending business profile',
      status: 409,
    });
  }

  const resolvedCategoryId = input.customCategoryName
    ? await resolveCustomCategory(input.customCategoryName)
    : input.categoryId!;

  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.id, resolvedCategoryId),
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

  return resolvedCategoryId;
}

export async function startBusinessReviewReserveCheckout(
  input: BusinessProfileSubmitInput,
  context: RequestContext,
  locale: Locale,
): Promise<BusinessReviewReserveCheckoutDto> {
  const db = getDbClient();
  const stripe = getStripeClient();
  const userId = context.actor?.kind === 'member' ? context.actor.userId : null;

  if (!userId) {
    throw new AppError({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: 'Authentication required',
      status: 401,
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: 'APP_URL is not configured',
      status: 500,
    });
  }

  await validateBusinessSubmitInputForUser(input, userId);

  const [pendingSubmission] = await db
    .insert(schema.businessReviewSubmissions)
    .values({
      user_id: userId,
      payload: input as unknown as Record<string, unknown>,
      reserve_amount: BUSINESS_REVIEW_RESERVE_AMOUNT,
      reserve_currency: BUSINESS_REVIEW_RESERVE_CURRENCY,
    })
    .returning();

  const metadata = buildBusinessReviewMetadata(userId, pendingSubmission!.id);

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: BUSINESS_REVIEW_RESERVE_CURRENCY,
            product_data: { name: BUSINESS_REVIEW_RESERVE_PRODUCT_NAME },
            unit_amount: BUSINESS_REVIEW_RESERVE_AMOUNT,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        capture_method: 'manual',
        metadata,
      },
      metadata,
      client_reference_id: userId,
      success_url: buildBusinessReviewSuccessUrl(appUrl, locale),
      cancel_url: buildBusinessReviewCancelUrl(appUrl, locale),
    });
  } catch (error) {
    await db
      .update(schema.businessReviewSubmissions)
      .set({
        status: 'FAILED',
        failed_at: new Date(),
        failure_reason: 'Stripe checkout creation failed',
      })
      .where(eq(schema.businessReviewSubmissions.id, pendingSubmission!.id));
    rethrowStripeCheckoutError(error);
  }

  if (!session.url) {
    await db
      .update(schema.businessReviewSubmissions)
      .set({
        status: 'FAILED',
        failed_at: new Date(),
        failure_reason: 'Stripe did not return a checkout URL',
      })
      .where(eq(schema.businessReviewSubmissions.id, pendingSubmission!.id));
    throw new AppError({
      code: ERROR_CODES.CHECKOUT_CREATION_FAILED,
      message: 'Stripe did not return a checkout URL',
      status: 500,
    });
  }

  await db
    .update(schema.businessReviewSubmissions)
    .set({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === 'string' ? session.payment_intent : null,
    })
    .where(eq(schema.businessReviewSubmissions.id, pendingSubmission!.id));

  return {
    checkoutUrl: session.url,
    pendingSubmissionId: pendingSubmission!.id,
    amount: BUSINESS_REVIEW_RESERVE_AMOUNT,
    currency: BUSINESS_REVIEW_RESERVE_CURRENCY,
  };
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

  const resolvedCategoryId = await validateBusinessSubmitInputForUser(input, userId);

  const slug = generateSlug(input.name);

  const [newBusinessData] = await db
    .insert(schema.businessProfiles)
    .values({
      user_id: userId,
      slug,
      name: input.name,
      representative_name: input.representativeName,
      representative_email: input.representativeEmail,
      representative_phone: input.representativePhone,
      country_id: input.countryId,
      city_id: input.cityId,
      category_id: resolvedCategoryId,
      website_url: input.websiteUrl ?? null,
      social_url: input.socialUrl ?? null,
      brief_description: input.briefDescription ?? null,
      status: 'UNDER_REVIEW',
    })
    .returning();

  const newBusiness = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, newBusinessData!.id),
    with: {
      category: CATEGORY_WITH_PARENTS,
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

export function validateBusinessReviewReservePaymentIntent(
  metadata: Record<string, string>,
  amountCapturable: number,
): string {
  const pendingSubmissionId = metadata.pendingSubmissionId;

  if (metadata.type !== 'business_review_reserve' || !metadata.userId || !pendingSubmissionId) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: 'payment_intent.amount_capturable_updated missing business review metadata',
      status: 500,
    });
  }

  if (amountCapturable < BUSINESS_REVIEW_RESERVE_AMOUNT) {
    throw new AppError({
      code: ERROR_CODES.STRIPE_CONFIG_MISSING,
      message: 'Business review reserve amount is below the required authorization',
      status: 500,
    });
  }

  return pendingSubmissionId;
}

export async function submitBusinessReviewAfterReserve(
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  const db = getDbClient();
  const metadata = paymentIntent.metadata ?? {};
  const pendingSubmissionId = validateBusinessReviewReservePaymentIntent(
    metadata,
    paymentIntent.amount_capturable,
  );

  const pendingSubmission = await db.query.businessReviewSubmissions.findFirst({
    where: eq(schema.businessReviewSubmissions.id, pendingSubmissionId),
  });

  if (!pendingSubmission) {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Business review pending submission not found',
      status: 500,
    });
  }

  if (pendingSubmission.status === 'SUBMITTED') return;

  if (pendingSubmission.status !== 'PENDING_PAYMENT') {
    throw new AppError({
      code: ERROR_CODES.RESOURCE_CONFLICT,
      message: `Business review pending submission is ${pendingSubmission.status}`,
      status: 500,
    });
  }

  const context = createRequestContext({
    actor: { kind: 'member', userId: pendingSubmission.user_id },
  });
  const input = pendingSubmission.payload as unknown as BusinessProfileSubmitInput;

  try {
    const business = await submitBusiness(input, context);
    await db
      .update(schema.businessReviewSubmissions)
      .set({
        status: 'SUBMITTED',
        business_profile_id: business.id,
        stripe_payment_intent_id: paymentIntent.id,
        submitted_at: new Date(),
      })
      .where(eq(schema.businessReviewSubmissions.id, pendingSubmission.id));
  } catch (error) {
    await db
      .update(schema.businessReviewSubmissions)
      .set({
        status: 'FAILED',
        stripe_payment_intent_id: paymentIntent.id,
        failed_at: new Date(),
        failure_reason: error instanceof Error ? error.message : 'Unknown submission failure',
      })
      .where(eq(schema.businessReviewSubmissions.id, pendingSubmission.id));
    throw error;
  }
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
  let resolvedCategoryId = input.categoryId;
  if (input.customCategoryName) {
    resolvedCategoryId = await resolveCustomCategory(input.customCategoryName);
  }

  if (resolvedCategoryId && resolvedCategoryId !== business.category_id) {
    const category = await db.query.categories.findFirst({
      where: eq(schema.categories.id, resolvedCategoryId),
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
      where: eq(schema.cities.id, targetCityId),
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
  delete dataToUpdate.customCategoryName;
  delete dataToUpdate.cityId;
  delete dataToUpdate.countryId;
  delete dataToUpdate.representativeName;
  delete dataToUpdate.representativeEmail;
  delete dataToUpdate.representativePhone;

  if (resolvedCategoryId !== undefined) dataToUpdate.category_id = resolvedCategoryId;
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

  await db
    .update(schema.businessProfiles)
    .set(dataToUpdate)
    .where(eq(schema.businessProfiles.id, businessId));

  const updatedBusiness = await db.query.businessProfiles.findFirst({
    where: eq(schema.businessProfiles.id, businessId),
    with: { category: CATEGORY_WITH_PARENTS, country: true, city: true },
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
    with: { category: CATEGORY_WITH_PARENTS, country: true, city: true },
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
    with: { category: CATEGORY_WITH_PARENTS, country: true, city: true },
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
    with: { category: CATEGORY_WITH_PARENTS, country: true, city: true },
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
    with: { category: CATEGORY_WITH_PARENTS, country: true, city: true },
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
  const categoryPath = getCategoryPath(business.category);

  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    categoryId: business.category_id,
    blockName: categoryPath.blockName,
    blockSlug: categoryPath.blockSlug,
    categoryName: categoryPath.categoryName ?? business.category?.name ?? 'Uncategorized',
    categorySlug: categoryPath.categorySlug,
    subcategoryName: categoryPath.subcategoryName,
    subcategorySlug: categoryPath.subcategorySlug,
    countryName: business.country?.name ?? 'Unknown',
    cityName: business.city?.name ?? 'Unknown',
    briefDescription: business.brief_description,
    websiteUrl: business.website_url,
    socialUrl: business.social_url,
    coverImageUrl: business.cover_image_url ?? null,
    logoUrl: business.logo_url ?? null,
    featuredTop: business.featured_top,
    featuredRecommended: business.featured_recommended,
    memberDiscountPercent: business.member_discount_percent ?? null,
    discountMuted: business.discount_muted,
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
    countryId: business.country_id,
    cityId: business.city_id,
    status: business.status as BusinessStatus,
    representativeEmail: business.representative_email,
    representativePhone: business.representative_phone,
    rejectionReason: business.rejection_reason,
    createdAt: business.created_at.toISOString(),
    updatedAt: business.updated_at.toISOString(),
  };
}

function getCategoryPath(category: any): {
  blockName: string | null;
  blockSlug: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  subcategoryName: string | null;
  subcategorySlug: string | null;
} {
  if (!category) {
    return {
      blockName: null,
      blockSlug: null,
      categoryName: null,
      categorySlug: null,
      subcategoryName: null,
      subcategorySlug: null,
    };
  }

  if (category.level === 'SUBCATEGORY') {
    const parent = category.parent;
    const block = parent?.parent;
    return {
      blockName: block?.name ?? null,
      blockSlug: block?.slug ?? null,
      categoryName: parent?.name ?? category.name,
      categorySlug: parent?.slug ?? category.slug,
      subcategoryName: category.name,
      subcategorySlug: category.slug,
    };
  }

  if (category.level === 'CATEGORY') {
    const block = category.parent;
    return {
      blockName: block?.name ?? null,
      blockSlug: block?.slug ?? null,
      categoryName: category.name,
      categorySlug: category.slug,
      subcategoryName: null,
      subcategorySlug: null,
    };
  }

  return {
    blockName: category.name,
    blockSlug: category.slug,
    categoryName: null,
    categorySlug: null,
    subcategoryName: null,
    subcategorySlug: null,
  };
}
