import { BUSINESS_STATUSES } from '@kclub/contracts';
import { z } from 'zod';

import {
  emailSchema,
  entityIdSchema,
  optionalSafeTextSchema,
  paginationSchema,
  phoneSchema,
  safeTextSchema,
  searchSchema,
  urlSchema,
  withoutHtml,
} from './shared';

export const businessNameSchema = withoutHtml(safeTextSchema.min(2).max(100));
export const representativeNameSchema = withoutHtml(safeTextSchema.min(2).max(100));
export const businessBriefDescriptionSchema = optionalSafeTextSchema(500);

export const customCategoryNameSchema = withoutHtml(safeTextSchema.min(2).max(120));

export const businessProfileSubmitSchema = z
  .object({
    name: businessNameSchema,
    representativeName: representativeNameSchema,
    representativeEmail: emailSchema,
    representativePhone: phoneSchema,
    countryId: entityIdSchema,
    cityId: entityIdSchema,
    categoryId: entityIdSchema.optional(),
    customCategoryName: customCategoryNameSchema.optional(),
    websiteUrl: urlSchema.optional(),
    socialUrl: urlSchema.optional(),
    briefDescription: businessBriefDescriptionSchema,
  })
  .superRefine((value, context) => {
    if (!value.categoryId && !value.customCategoryName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categoryId'],
        message: 'Category selection or custom category name is required',
      });
    }
    if (value.categoryId && value.customCategoryName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customCategoryName'],
        message: 'Provide either a category selection or a custom name, not both',
      });
    }
    if (!value.websiteUrl && !value.socialUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['websiteUrl'],
        message: 'Website or social URL is required',
      });
    }
  });

export const businessProfileEditableFieldsSchema = z
  .object({
    name: businessNameSchema.optional(),
    representativeName: representativeNameSchema.optional(),
    representativeEmail: emailSchema.optional(),
    representativePhone: phoneSchema.optional(),
    countryId: entityIdSchema.optional(),
    cityId: entityIdSchema.optional(),
    categoryId: entityIdSchema.optional(),
    customCategoryName: customCategoryNameSchema.optional(),
    websiteUrl: urlSchema.optional().nullable(),
    socialUrl: urlSchema.optional().nullable(),
    briefDescription: businessBriefDescriptionSchema,
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'At least one business field is required',
  })
  .superRefine((value, context) => {
    if (value.categoryId && value.customCategoryName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customCategoryName'],
        message: 'Provide either a category selection or a custom name, not both',
      });
    }
    if (value.websiteUrl === null && value.socialUrl === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['websiteUrl'],
        message: 'Website or social URL is required',
      });
    }
  });

export const businessListFilterSchema = paginationSchema.extend({
  search: searchSchema,
  status: z.enum(BUSINESS_STATUSES).optional(),
  countryId: entityIdSchema.optional(),
  cityId: entityIdSchema.optional(),
  categoryId: entityIdSchema.optional(),
  featuredTop: z.coerce.boolean().optional(),
  featuredRecommended: z.coerce.boolean().optional(),
});

export type BusinessProfileSubmitInput = z.infer<typeof businessProfileSubmitSchema>;
export type BusinessProfileEditableFieldsInput = z.infer<
  typeof businessProfileEditableFieldsSchema
>;
export type BusinessListFilterInput = z.infer<typeof businessListFilterSchema>;
