import { describe, expect, it } from 'vitest';

import {
  formatCardExpiry,
  formatMaskedCardNumber,
} from '../../../src/features/member/components/card-display';

describe('formatMaskedCardNumber', () => {
  it('masks MEM card numbers and shows the last four digits', () => {
    expect(formatMaskedCardNumber('MEM-000001')).toBe('•••• •••• •••• 0001');
  });

  it('masks VIP card numbers and shows the last four digits', () => {
    expect(formatMaskedCardNumber('VIP-000042')).toBe('•••• •••• •••• 0042');
  });

  it('returns the original value for unknown formats', () => {
    expect(formatMaskedCardNumber('CUSTOM-123')).toBe('CUSTOM-123');
  });
});

describe('formatCardExpiry', () => {
  it('formats expiry dates as MM/YY', () => {
    expect(formatCardExpiry('2030-06-19T00:00:00.000Z', 'en')).toMatch(/06\/30/);
  });

  it('returns placeholders when there is no expiry date', () => {
    expect(formatCardExpiry(null, 'en')).toBe('••/••');
  });
});
