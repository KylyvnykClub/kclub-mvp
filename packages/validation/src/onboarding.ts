import { z } from 'zod';

import {
  emailSchema,
  localeSchema,
  optionalSafeTextSchema,
  phoneSchema,
  safeTextSchema,
  withoutHtml,
} from './shared';

export const displayNameSchema = withoutHtml(safeTextSchema.min(2).max(100));
const optionalShortText = (max: number) =>
  withoutHtml(z.string().trim().max(max)).optional().nullable();
const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  emailSchema.optional().nullable(),
);

export const memberOnboardingSchema = z.object({
  phone: phoneSchema,
  displayName: displayNameSchema,
  email: optionalEmailSchema,
  localePreference: localeSchema,
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Terms must be accepted' }),
  }),
});

export const memberProfileUpdateSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    localePreference: localeSchema.optional(),
    country: optionalShortText(100),
    city: optionalShortText(100),
    about: optionalSafeTextSchema(500),
    avatarUrl: z.string().url().optional().nullable(),
  })
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: 'At least one profile field is required',
  });

export type MemberOnboardingInput = z.infer<typeof memberOnboardingSchema>;
export type MemberProfileUpdateInput = z.infer<typeof memberProfileUpdateSchema>;
