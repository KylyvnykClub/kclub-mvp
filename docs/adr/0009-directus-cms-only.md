# ADR 0009: Directus Is CMS-Only

## Status

Accepted

## Context

The system needs a content management layer for public-facing content, translations, SEO metadata, FAQ, legal documents, and media. This content layer must be cleanly separated from the core domain to prevent CMS access from leaking into business-critical data.

## Decision

Directus manages public content, translations, SEO metadata, FAQ, legal documents, and media. It is isolated from core-domain data by separate database/schema and credentials. Cards, memberships, payments, staff, permissions, partner approval, and audit remain product-core concerns.

## Consequences

- Content editors can work in Directus without access to business data.
- CMS credentials and database are isolated from product-core.
- Product-core fetches CMS content at build or request time but never writes to it.
- Adding new public content types requires Directus schema changes, not product-core changes.

## Alternatives Considered

- Using product-core database tables for public content.
- Headless WordPress.
- Markdown files in the repository.
