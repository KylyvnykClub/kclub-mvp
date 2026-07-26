# ADR 0012: App Router Internationalization with next-intl

## Status

Accepted

## Context

Product-core requires locale-prefixed routes (`/en`, `/ru`, `/uk`), hreflang alternates including `x-default`, and all visible strings sourced from locale messages rather than hard-coded component copy. The localization mechanism must be decided before any indexable page is built.

## Decision

`apps/product-core` uses next-intl with App Router locale-based routing:

- Locales are `en`, `ru`, `uk`; the default locale is `en`.
- Routing uses `localePrefix: 'always'`; every page is served under `/[locale]/*`.
- Routing is declared once in `src/i18n/routing.ts`; navigation helpers are exposed via `createNavigation`.
- Request-time locale resolution lives in `src/i18n/request.ts`, loading `messages/<locale>.json`.
- The root layout at `src/app/[locale]/layout.tsx` renders `NextIntlClientProvider`, sets `<html lang={locale}>`, and produces hreflang metadata.
- Message catalogs are local JSON files under `src/messages/<locale>.json` with key parity across locales.

Directus remains the system of record for translated content (ADR 0009). For MVP, marketing copy is co-located as local JSON catalogs until the CMS content pipeline is built.

## Consequences

- Every indexable route is locale-prefixed; bare `/` redirects to `/en`.
- Adding a page requires matching entries across all locale message files.
- Client components obtain translations through next-intl hooks after `NextIntlClientProvider` is mounted.
- Migrating catalog source to Directus will not change the routing decision.

## Alternatives Considered

- next-translate.
- Custom i18n middleware without a library.
- Subdomain-based locale routing.
