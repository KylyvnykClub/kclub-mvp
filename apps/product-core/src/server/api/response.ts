import { NextResponse } from 'next/server';

import {
  createApiError,
  createApiSuccess,
  type ApiError,
  type ApiMeta,
  type ApiResponse,
} from '@kclub/contracts';

import { mapErrorToApiError, type ErrorResponseMapping } from '@/server/errors';
import { createLogger } from '@/server/logger';

type ResponseInit = {
  status?: number;
  headers?: HeadersInit;
};

export function withTimestamp(meta: ApiMeta = {}): ApiMeta {
  return {
    ...meta,
    timestamp: meta.timestamp ?? new Date().toISOString(),
  };
}

export function successResponse<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  return createApiSuccess(data, meta);
}

export function errorResponse(error: ApiError, meta?: ApiMeta): ApiResponse<never> {
  return createApiError(error, meta);
}

export function jsonSuccess<T>(
  data: T,
  meta?: ApiMeta,
  init?: ResponseInit,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(successResponse(data, withTimestamp(meta)), {
    status: init?.status ?? 200,
    ...(init?.headers ? { headers: init.headers } : {}),
  });
}

export function jsonError(
  error: ApiError,
  meta?: ApiMeta,
  init?: ResponseInit,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(errorResponse(error, withTimestamp(meta)), {
    status: init?.status ?? 500,
    ...(init?.headers ? { headers: init.headers } : {}),
  });
}

export function jsonErrorFromUnknown(
  error: unknown,
  meta?: ApiMeta,
): NextResponse<ApiResponse<never>> {
  const mapped = mapErrorToApiError(error);

  const log = createLogger();

  if (error instanceof Error) {
    log.error('API error response', {
      error: { code: mapped.error.code, message: mapped.error.message },
      status: mapped.status,
      originalError: error.message,
      stack: error.stack,
    });
  } else {
    log.error('API error response', {
      error: { code: mapped.error.code, message: mapped.error.message },
      status: mapped.status,
    });
  }

  return jsonError(mapped.error, meta, { status: mapped.status });
}

export function toApiErrorMapping(error: unknown): ErrorResponseMapping {
  return mapErrorToApiError(error);
}
