import { z } from 'zod';

import { localeSchema, otpCodeSchema, phoneSchema } from './shared';

export const memberPasswordSchema = z
  .string()
  .min(6, 'Password must contain at least 6 characters')
  .max(128, 'Password must contain at most 128 characters');

export const memberSignUpSchema = z.object({
  phone: phoneSchema,
  password: memberPasswordSchema,
  locale: localeSchema.optional(),
});

export const memberSignUpVerifySchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema,
});

export const memberPasswordSignInSchema = z.object({
  phone: phoneSchema,
  password: memberPasswordSchema,
});

export const memberPasswordRecoverySendSchema = z.object({
  phone: phoneSchema,
});

export const memberPasswordRecoveryVerifySchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema,
  password: memberPasswordSchema,
});

export type MemberSignUpInput = z.infer<typeof memberSignUpSchema>;
export type MemberSignUpVerifyInput = z.infer<typeof memberSignUpVerifySchema>;
export type MemberPasswordSignInInput = z.infer<typeof memberPasswordSignInSchema>;
export type MemberPasswordRecoverySendInput = z.infer<typeof memberPasswordRecoverySendSchema>;
export type MemberPasswordRecoveryVerifyInput = z.infer<typeof memberPasswordRecoveryVerifySchema>;
