# Caching Implementation - Phase 1

## Overview

Implemented ISR (Incremental Static Regeneration) with tag-based revalidation for public business pages.

## Changes Made

### 1. Business Cache Layer

**Created**: `src/server/cache/business-cache.ts`

- `getCachedPublicBusinesses()` - Cached version with 60s revalidation
- `getCachedPublicBusinessBySlug()` - Cached version with 60s revalidation
- Tags: `businesses`, `public-businesses`, `public-business-detail`

**Created**: `src/server/cache/index.ts`

- Re-exports for cache functions

### 2. ISR for Marketing Pages

**Modified**: `src/app/[locale]/(marketing)/page.tsx`

- Added `export const revalidate = 60`
- Added `generateStaticParams()` for en/ru/uk locales
- Switched to `getCachedPublicBusinesses()`

**Modified**: `src/app/[locale]/(marketing)/directory/page.tsx`

- Added `export const revalidate = 60`
- Added `generateStaticParams()` for en/ru/uk locales
- Switched to `getCachedPublicBusinesses()`
- Updated `DirectorySection` type signature

**Modified**: `src/app/[locale]/(marketing)/directory/[slug]/page.tsx`

- Added `export const revalidate = 60`
- Added `generateStaticParams()` that fetches all published business slugs
- Switched to `getCachedPublicBusinessBySlug()`

### 3. Tag-Based Revalidation

**Modified**: `src/server/services/admin-service.ts`

- Added `revalidateTag('businesses')` and `revalidateTag('public-businesses')` to:
  - `approveBusiness()`
  - `rejectBusiness()`
  - `hideBusiness()`
  - `updateBusinessFeatured()`

**Modified**: `src/server/services/webhook-service.ts`

- Added `revalidateTag('businesses')` and `revalidateTag('public-businesses')` to:
  - `handlePlacementCheckoutCompleted()`

## How It Works

1. **Initial Request**: Page is statically generated and cached
2. **Subsequent Requests**: Served from cache (ISR) for up to 60 seconds
3. **Background Revalidation**: After 60s, next request triggers background regeneration
4. **Manual Invalidation**: Admin actions immediately invalidate cache via `revalidateTag()`

## Cache Invalidation Triggers

- Business approved (admin)
- Business rejected (admin)
- Business hidden (admin)
- Business featured status changed (admin)
- Business published via Stripe webhook (placement checkout completed)

## Performance Impact

- **Before**: SSR on every request (DB query + render)
- **After**: Static generation + 60s cache + background revalidation
- **Expected**: ~95% reduction in DB queries for public pages

## Testing

Run typecheck:

```bash
bun run typecheck
```

Verify cache headers in production:

```bash
curl -I https://your-domain.com/en
# Look for: x-nextjs-cache: HIT | STALE | MISS
```

## Next Phases

- **Phase 2**: Taxonomy cache (categories, countries, cities)
- **Phase 3**: Member profile request-scoped cache
- **Phase 4**: TOTP cache with TTL
- **Phase 5**: Rate limiting for public endpoints

## Notes

- ISR pages show stale data for up to 60 seconds (acceptable for public directory)
- `generateStaticParams` pre-generates all known business detail pages at build time
- Cache is automatically invalidated when business data changes via admin actions or webhooks
