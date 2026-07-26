import { z } from 'zod';

export const CARD_NUMBER_PATTERN = /^(MEM|VIP)-(\d{6})$/;

export const cardNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(CARD_NUMBER_PATTERN, 'Card number must be in format MEM-000001 or VIP-000001');

export type CardNumberParts = {
  tier: 'MEM' | 'VIP';
  sequence: number;
};

export function parseCardNumber(cardNumber: string): CardNumberParts {
  const match = CARD_NUMBER_PATTERN.exec(cardNumber.trim().toUpperCase());
  if (!match) {
    throw new Error(`Invalid card number format: ${cardNumber}`);
  }
  return {
    tier: match[1]! as 'MEM' | 'VIP',
    sequence: parseInt(match[2]!, 10),
  };
}

export function formatCardNumber(tier: 'MEM' | 'VIP', sequence: number): string {
  return `${tier}-${String(sequence).padStart(6, '0')}`;
}

export function cardNumberToTierPrefix(tier: 'MEMBER' | 'VIP'): 'MEM' | 'VIP' {
  return tier === 'MEMBER' ? 'MEM' : 'VIP';
}
