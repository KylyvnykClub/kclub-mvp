# ADR 0010: Token-Driven Shared UI

## Status

Accepted

## Context

Product-core and admin-app serve different audiences but must share a consistent visual language. Multi-agent development increases the risk of duplicated components and inconsistent visual values across surfaces.

## Decision

Visual rules live in `packages/ui` tokens and reusable primitives. Raw feature-level visual values and duplicated generic components are prohibited. Public and operations surfaces may have different compositions, but share the same visual language and accessibility behavior.

## Consequences

- All color, spacing, typography, and radius values come from tokens.
- New UI components are added to `packages/ui`, not duplicated per app.
- Feature code references tokens, not hard-coded values.
- Accessibility behavior is consistent across both apps.

## Alternatives Considered

- Per-app component libraries with no shared tokens.
- A third-party component library used directly without a token layer.
