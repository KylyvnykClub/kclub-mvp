const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatMoney(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(minorUnits / 100);
}

export function formatMoneyCompact(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(minorUnits / 100);
}

export function formatUpdatedAgo(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();
  if (elapsed < MINUTE_MS) return 'Updated just now';
  if (elapsed < HOUR_MS) return `Updated ${Math.floor(elapsed / MINUTE_MS)} min ago`;
  if (elapsed < DAY_MS) return `Updated ${Math.floor(elapsed / HOUR_MS)} h ago`;
  return `Updated ${Math.floor(elapsed / DAY_MS)} d ago`;
}

export function formatInDays(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'in 1 day';
  return `in ${days} days`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Percentage change vs the previous window; null when there is no baseline. */
export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
