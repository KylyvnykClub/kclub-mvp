import type { BusinessStatus } from '@kclub/contracts';

export const MVP_BUSINESS_STATUSES: readonly BusinessStatus[] = [
  'UNDER_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'REJECTED',
  'HIDDEN',
] as const;

export const FEATURED_TOP_MAX = 3;
export const FEATURED_RECOMMENDED_MAX = 3;

const BUSINESS_STATUS_TRANSITIONS: Record<BusinessStatus, readonly BusinessStatus[]> = {
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['PUBLISHED', 'REJECTED'],
  PUBLISHED: ['HIDDEN'],
  REJECTED: [],
  HIDDEN: ['PUBLISHED'],
};

export type BusinessTransitionResult = {
  allowed: boolean;
  resetsFeaturedFlags: boolean;
};

export function canTransitionBusinessStatus(
  current: BusinessStatus,
  next: BusinessStatus,
): boolean {
  return BUSINESS_STATUS_TRANSITIONS[current].includes(next);
}

export function getBusinessTransitionResult(
  current: BusinessStatus,
  next: BusinessStatus,
): BusinessTransitionResult {
  return {
    allowed: canTransitionBusinessStatus(current, next),
    resetsFeaturedFlags: current === 'PUBLISHED' && next !== 'PUBLISHED',
  };
}

export function canFeatureBusiness(status: BusinessStatus): boolean {
  return status === 'PUBLISHED';
}

export function getFeaturedSlotsRemaining(
  featuredTopCount: number,
  featuredRecommendedCount: number,
): {
  topRemaining: number;
  recommendedRemaining: number;
} {
  return {
    topRemaining: Math.max(FEATURED_TOP_MAX - featuredTopCount, 0),
    recommendedRemaining: Math.max(FEATURED_RECOMMENDED_MAX - featuredRecommendedCount, 0),
  };
}

export function canSetFeaturedFlag(
  status: BusinessStatus,
  nextValue: boolean,
  currentCount: number,
  limit: number,
): boolean {
  if (!nextValue) return true;
  if (!canFeatureBusiness(status)) return false;
  return currentCount < limit;
}
