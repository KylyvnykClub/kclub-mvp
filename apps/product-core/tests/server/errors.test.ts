import { describe, expect, test } from 'vitest';

import { ERROR_CODES } from '@kclub/contracts';

import { AppError, mapErrorToApiError } from '../../src/server/errors';

describe('product-core error mapping', () => {
  test('maps app errors to contract error responses', () => {
    const mapped = mapErrorToApiError(
      new AppError({
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Business not found',
        details: { entity: 'business' },
      }),
    );

    expect(mapped).toEqual({
      status: 404,
      error: {
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Business not found',
        details: { entity: 'business' },
      },
    });
  });

  test('returns safe server errors for unknown failures', () => {
    expect(mapErrorToApiError(new Error('database password leaked'))).toEqual({
      status: 500,
      error: {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Unexpected server error',
      },
    });
  });

  test('keeps permission and rate-limit statuses stable', () => {
    expect(
      mapErrorToApiError(
        new AppError({
          code: ERROR_CODES.PERMISSION_DENIED,
          message: 'Forbidden',
        }),
      ).status,
    ).toBe(403);

    expect(
      mapErrorToApiError(
        new AppError({
          code: ERROR_CODES.RATE_LIMITED,
          message: 'Too many requests',
        }),
      ).status,
    ).toBe(429);
  });
});
