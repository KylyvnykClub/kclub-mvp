import { describe, expect, test } from 'vitest';

import { ERROR_CODES } from '@kclub/contracts';

import { errorResponse, successResponse, withTimestamp } from '../../src/server/api';

describe('product-core api response helpers', () => {
  test('wrap success data in the shared contract envelope', () => {
    expect(successResponse({ ok: true }, { timestamp: '2026-06-15T00:00:00.000Z' })).toEqual({
      data: { ok: true },
      meta: { timestamp: '2026-06-15T00:00:00.000Z' },
      error: null,
    });
  });

  test('wrap errors in the shared contract envelope', () => {
    expect(
      errorResponse({
        code: ERROR_CODES.VALIDATION_INVALID_INPUT,
        message: 'Invalid input',
      }),
    ).toEqual({
      data: null,
      error: {
        code: ERROR_CODES.VALIDATION_INVALID_INPUT,
        message: 'Invalid input',
      },
    });
  });

  test('adds a timestamp without replacing explicit metadata', () => {
    expect(withTimestamp({ timestamp: '2026-06-15T00:00:00.000Z', page: 1 })).toEqual({
      timestamp: '2026-06-15T00:00:00.000Z',
      page: 1,
    });
  });
});
