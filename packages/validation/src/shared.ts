import { ERROR_CODES, type ErrorCode, LOCALES } from '@kclub/contracts';
import { z, type ZodError, type ZodIssue } from 'zod';

export const phoneSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[\s\-()]/g, ''))
  .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, 'validation.phone.invalidFormat'));

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/, 'validation.otp.invalidFormat');

export const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'validation.totp.invalidFormat');

export const passwordSchema = z
  .string()
  .min(10, 'validation.password.tooShort')
  .max(128, 'validation.password.tooLong');

export const localeSchema = z.enum(LOCALES, {
  errorMap: () => ({ message: 'validation.locale.invalid' }),
});

export const safeTextSchema = z.string().trim().min(1);

export function withoutHtml<T extends z.ZodString>(schema: T): z.ZodEffects<T, string, string> {
  return schema.refine((value) => !/[<>]/.test(value), 'validation.text.noHtml');
}

export const optionalSafeTextSchema = (max: number) =>
  withoutHtml(z.string().trim().max(max)).optional().nullable();

export const urlSchema = z.string().trim().url('validation.url.invalid');

export const uuidSchema = z.string().trim().uuid('validation.uuid.invalid');

export const cuidSchema = z
  .string()
  .trim()
  .regex(/^c[a-z0-9]{8,32}$/i, 'validation.cuid.invalid');

export const entityIdSchema = z.union([uuidSchema, cuidSchema]);

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'validation.slug.invalidFormat');

export const emailSchema = z.string().trim().email('validation.email.invalid');

export const pageSchema = z.coerce.number().int().min(1).default(1);
export const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

export const paginationSchema = z.object({
  page: pageSchema,
  limit: limitSchema,
});

export const searchSchema = z.string().trim().min(1).max(120).optional();

export const entityIdParamSchema = z.object({
  id: entityIdSchema,
});

export type ValidationIssue = {
  path: string;
  code: ErrorCode;
  message: string;
};

export type ValidationErrorResult = {
  code: typeof ERROR_CODES.VALIDATION_INVALID_INPUT;
  message: string;
  issues: ValidationIssue[];
};

export function getValidationErrorCode(issue: ZodIssue): ErrorCode {
  if (issue.code === 'invalid_string') {
    if (issue.validation === 'email') return ERROR_CODES.VALIDATION_INVALID_EMAIL;
    if (issue.validation === 'url') return ERROR_CODES.VALIDATION_INVALID_URL;
    if (issue.validation === 'uuid') return ERROR_CODES.VALIDATION_INVALID_INPUT;
    if (issue.validation === 'regex') {
      const path = issue.path.join('.');
      if (path.toLowerCase().includes('phone')) return ERROR_CODES.VALIDATION_INVALID_PHONE;
    }
  }

  if (
    issue.code === 'invalid_enum_value' &&
    issue.path.join('.').toLowerCase().includes('locale')
  ) {
    return ERROR_CODES.VALIDATION_INVALID_LOCALE;
  }

  return ERROR_CODES.VALIDATION_INVALID_INPUT;
}

export function formatZodError(error: ZodError): ValidationErrorResult {
  return {
    code: ERROR_CODES.VALIDATION_INVALID_INPUT,
    message: 'Invalid input',
    issues: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      code: getValidationErrorCode(issue),
      message: issue.message,
    })),
  };
}

export function parseWithValidation<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  value: unknown,
): { success: true; data: z.infer<TSchema> } | { success: false; error: ValidationErrorResult } {
  const result = schema.safeParse(value);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: formatZodError(result.error) };
}
