import type { Locale } from '@/i18n/routing';

const CARD_NUMBER_PATTERN = /^(MEM|VIP)-(\d+)$/;

export function formatMaskedCardNumber(cardNumber: string): string {
  const match = cardNumber.match(CARD_NUMBER_PATTERN);
  if (!match) return cardNumber;

  const digits = match[2]!.padStart(6, '0');
  const lastFour = digits.slice(-4);

  return `•••• •••• •••• ${lastFour}`;
}

export function formatCardExpiry(isoDate: string | null, locale: Locale): string {
  if (!isoDate) return '••/••';

  return new Date(isoDate).toLocaleDateString(locale, {
    month: '2-digit',
    year: '2-digit',
  });
}
