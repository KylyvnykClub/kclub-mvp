# Responsive quality baseline

## Required viewports

Validate consumer routes at 320px, 375px, 768px, 1024px, and 1440px. The Playwright projects cover Pixel 5, iPad Pro 11, Desktop Chrome, and large Desktop Chrome; 320px remains a targeted browser-check width for narrow-device regressions.

## Interaction requirements

- Interactive controls must have a minimum 44px target on touch surfaces.
- Mobile dialogs and menus must trap keyboard focus, close with Escape, restore focus to their trigger, and account for safe-area insets.
- Use `svh` with `dvh` enhancement for full-height surfaces. Do not rely on `100vh` for primary actions.
- All animation must have a usable static presentation under `prefers-reduced-motion: reduce`.

## Web Vitals

Product-core reports LCP, CLS, and INP through Plausible as `WebVital`. Every event includes the metric/rating/value and the current route/device class; Vercel deployments also include the public commit SHA when available. Track p75 mobile results against LCP below 2.5s, INP below 100ms, and CLS below 0.1 before accepting performance work.

## Offline behavior

KCLUB does not register a service worker. Authenticated membership, payments, and current business status require fresh server data. Failed reads may be retried; failed mutations must remain explicit and never be queued silently.
