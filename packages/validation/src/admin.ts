import { z } from 'zod';
import {
  ALL_STAFF_PERMISSIONS,
  AUDIT_ACTIONS,
  BUSINESS_STATUSES,
  CLUB_CARD_STATUSES,
  INTRODUCTION_STATUSES,
  MEMBER_TIERS,
  STAFF_ROLES,
  USER_STATUSES,
} from '@kclub/contracts';
import { pageSchema, limitSchema, searchSchema } from './shared';
import {
  businessNameSchema,
  representativeNameSchema,
  businessBriefDescriptionSchema,
} from './business';
import { emailSchema, phoneSchema, urlSchema } from './shared';

export const blockUserSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

export const unblockUserSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

export const revokeCardSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

export const reissueCardSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

export const businessApproveSchema = z.object({
  notes: z.string().max(2000).optional(),
});

export const businessRejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const businessHideSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

export const businessFeaturedSchema = z.object({
  featuredTop: z.boolean().optional(),
  featuredRecommended: z.boolean().optional(),
  memberDiscountPercent: z.number().int().min(0).max(100).optional().nullable(),
  discountMuted: z.boolean().optional(),
});

export const introductionApproveSchema = z.object({
  notes: z.string().max(2000).optional(),
});

export const introductionRejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  isHighRisk: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  isCustom: z.boolean().optional().default(false),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const countryCreateSchema = z.object({
  code2: z.string().length(2),
  code3: z.string().length(3).optional(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  isActive: z.boolean().optional().default(true),
});

export const countryUpdateSchema = countryCreateSchema.partial();

export const cityCreateSchema = z.object({
  countryId: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  isActive: z.boolean().optional().default(true),
});

export const cityUpdateSchema = cityCreateSchema.partial();

export const adminConfigUpdateSchema = z.object({
  value: z.any(),
  description: z.string().max(500).optional(),
});

export const staffRoleUpdateSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MODERATOR']),
});

export const adminStaffCreateSchema = z.object({
  phone: phoneSchema,
  displayName: z.string().trim().min(1).max(100).optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MODERATOR']),
});

export const adminUserListSchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: searchSchema,
  status: z.enum(USER_STATUSES).optional(),
  membershipTier: z.enum(MEMBER_TIERS).optional(),
});

export const adminCardListSchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: searchSchema,
  status: z.enum(CLUB_CARD_STATUSES).optional(),
  membershipTier: z.enum(MEMBER_TIERS).optional(),
});

export const adminBusinessListSchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  status: z.enum(BUSINESS_STATUSES).optional(),
});

export const adminIntroductionListSchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  status: z.enum(INTRODUCTION_STATUSES).optional(),
  businessId: z.string().uuid().optional(),
});

export const auditLogListSchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  action: z.enum(AUDIT_ACTIONS).optional(),
  actorRole: z.enum(STAFF_ROLES).optional(),
  actorStaffId: z.string().uuid().optional(),
  entityType: z.string().max(120).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const staffPermissionEnum = z.enum(ALL_STAFF_PERMISSIONS as [string, ...string[]]);

export const staffPermissionOverridesUpdateSchema = z
  .object({
    granted: z.array(staffPermissionEnum).default([]),
    denied: z.array(staffPermissionEnum).default([]),
  })
  .refine(
    (data) => {
      const overlap = data.granted.filter((p) => data.denied.includes(p));
      return overlap.length === 0;
    },
    { message: 'validation.permissions.grantDenyConflict' },
  );

export const staffDeactivateSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

export const staffPasswordResetSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

export type AdminUserListInput = z.infer<typeof adminUserListSchema>;
export type AdminCardListInput = z.infer<typeof adminCardListSchema>;
export type AdminBusinessListInput = z.infer<typeof adminBusinessListSchema>;

export type BlockUserInput = z.infer<typeof blockUserSchema>;
export type UnblockUserInput = z.infer<typeof unblockUserSchema>;
export type RevokeCardInput = z.infer<typeof revokeCardSchema>;
export type ReissueCardInput = z.infer<typeof reissueCardSchema>;
export type BusinessApproveInput = z.infer<typeof businessApproveSchema>;
export type BusinessRejectInput = z.infer<typeof businessRejectSchema>;
export type BusinessHideInput = z.infer<typeof businessHideSchema>;
export type BusinessFeaturedInput = z.infer<typeof businessFeaturedSchema>;
export type IntroductionApproveInput = z.infer<typeof introductionApproveSchema>;
export type IntroductionRejectInput = z.infer<typeof introductionRejectSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type CountryCreateInput = z.infer<typeof countryCreateSchema>;
export type CountryUpdateInput = z.infer<typeof countryUpdateSchema>;
export type CityCreateInput = z.infer<typeof cityCreateSchema>;
export type CityUpdateInput = z.infer<typeof cityUpdateSchema>;
export type AdminConfigUpdateInput = z.infer<typeof adminConfigUpdateSchema>;
export type StaffRoleUpdateInput = z.infer<typeof staffRoleUpdateSchema>;
export type AdminStaffCreateInput = z.infer<typeof adminStaffCreateSchema>;
export type AdminIntroductionListInput = z.infer<typeof adminIntroductionListSchema>;
export type AuditLogListInput = z.infer<typeof auditLogListSchema>;
export type StaffDeactivateInput = z.infer<typeof staffDeactivateSchema>;
export type StaffPasswordResetInput = z.infer<typeof staffPasswordResetSchema>;
export type StaffPermissionOverridesUpdateInput = z.infer<
  typeof staffPermissionOverridesUpdateSchema
>;

export const adminBusinessUpdateSchema = z.object({
  name: businessNameSchema.optional(),
  representativeName: representativeNameSchema.optional(),
  representativeEmail: emailSchema.optional(),
  representativePhone: phoneSchema.optional(),
  websiteUrl: urlSchema.optional().nullable(),
  socialUrl: urlSchema.optional().nullable(),
  briefDescription: businessBriefDescriptionSchema,
});

export type AdminBusinessUpdateInput = z.infer<typeof adminBusinessUpdateSchema>;
