# ADR 0013: Lucide React Icons

## Status

Accepted

## Context

Both apps need a consistent icon set. A shared icon source prevents visual fragmentation and avoids project-specific icon conventions that diverge over time.

## Decision

Use `lucide-react` as the shared source for interface icons in React surfaces. Lucide provides tree-shakeable named exports, a consistent visual language, and standard SVG accessibility attributes.

Icons remain presentational: meaningful labels stay in localized text, decorative icons are hidden from assistive technology, and components consume design-system color and sizing tokens rather than hard-coded visual values.

## Consequences

- All icons come from one package with a single visual style.
- Tree-shaking keeps bundle size proportional to icons actually used.
- Icon accessibility is handled through SVG attributes, not wrapper components.
- Adding custom icons outside Lucide requires explicit justification.

## Alternatives Considered

- Heroicons.
- React Icons (multi-library wrapper).
- Custom SVG icon set.
