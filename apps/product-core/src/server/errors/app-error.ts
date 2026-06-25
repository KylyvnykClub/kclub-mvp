import { ZodError } from 'zod';

import { ERROR_CODES, type ApiError, type ErrorCode } from '@kclub/contracts';

export type AppErrorOptions = {
  code: ErrorCode;
  message: string;
  status?: number;
  details?: Record<string, unknown>;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'AppError';
    this.code = options.code;
    this.status = options.status ?? statusForErrorCode(options.code);
    this.details = options.details;
  }
}

export type ErrorResponseMapping = {
  error: ApiError;
  status: number;
};

export function mapErrorToApiError(error: unknown): ErrorResponseMapping {
  if (error instanceof AppError) {
    return {
      status: error.status,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    };
  }

  if (error instanceof ZodError) {
    const fieldErrors = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    return {
      status: 400,
      error: {
        code: ERROR_CODES.VALIDATION_INVALID_INPUT,
        message: 'Validation failed',
        details: { fields: fieldErrors },
      },
    };
  }

  return {
    status: 500,
    error: {
      code: ERROR_CODES.SERVER_ERROR,
      message: 'Unexpected server error',
    },
  };
}

function statusForErrorCode(code: ErrorCode): number {
  if (code.startsWith('AUTH_')) {
    return 401;
  }

  if (code.startsWith('PERMISSION_') || code === ERROR_CODES.VIP_REQUIRED) {
    return 403;
  }

  if (code.startsWith('VALIDATION_')) {
    return 400;
  }

  if (code === ERROR_CODES.RESOURCE_NOT_FOUND || code === ERROR_CODES.CARD_NOT_FOUND) {
    return 404;
  }

  if (
    code === ERROR_CODES.RESOURCE_CONFLICT ||
    code === ERROR_CODES.BUSINESS_ALREADY_ACTIVE ||
    code === ERROR_CODES.CARD_ALREADY_ACTIVE ||
    code === ERROR_CODES.INTRODUCTION_PENDING_EXISTS
  ) {
    return 409;
  }

  if (code === ERROR_CODES.RESOURCE_GONE) {
    return 410;
  }

  if (code.startsWith('RATE_LIMIT_') || code === ERROR_CODES.RATE_LIMITED) {
    return 429;
  }

  return 500;
}
