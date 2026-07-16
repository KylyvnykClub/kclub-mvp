import { z } from 'zod';

import { passwordSchema, phoneSchema } from './shared';

export const staffPasswordRegisterSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

export const staffPasswordSignInSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

export type StaffPasswordRegisterInput = z.infer<typeof staffPasswordRegisterSchema>;
export type StaffPasswordSignInInput = z.infer<typeof staffPasswordSignInSchema>;
