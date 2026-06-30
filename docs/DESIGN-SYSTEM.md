# KCLUB MVP v4 — Design System

| Field            | Value      |
| ---------------- | ---------- |
| Document version | `1.0.0`    |
| Status           | Active     |
| Last updated     | 2026-06-19 |

## Purpose

This document defines the visual language, component usage rules, and design constraints for KCLUB MVP v4. All contributors — human and AI agents — must follow these rules. The goal is visual consistency across `apps/product-core` and `apps/admin-app` regardless of who writes the code.

**Source of truth for UI decisions: this document wins over personal taste, prior art from other projects, and generic Tailwind examples from the internet.**

---

## 1. Technology Stack

| Tool                                | Role                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| Tailwind CSS                        | Utility-first styling. No plain CSS files, no CSS modules, no styled-components                     |
| `@kclub/ui`                         | Shared primitive components. Always use these before writing custom markup                          |
| `cn()` from `@kclub/ui`             | Class merging utility. Always use `cn()` to combine Tailwind classes, never string concatenation    |
| `packages/config/tailwind/theme.ts` | Shared Tailwind config — brand color tokens and semantic token mappings                             |
| `packages/ui/src/styles/tokens.css` | **Canonical source of all semantic theme tokens** (CSS custom properties for light and dark themes) |

**No inline styles.** `style={{}}` is forbidden except for dynamic values that Tailwind cannot express (e.g. a CSS custom property driven by JavaScript). Justify with a comment if used.

### 1.1 Semantic Token Architecture

All theme values flow from a single canonical source:

1. **`packages/ui/src/styles/tokens.css`** defines CSS custom properties (`--background`, `--foreground`, `--surface`, `--accent`, etc.) for both light and dark themes.
2. **`packages/config/tailwind/theme.ts`** maps those CSS variables to Tailwind color utilities (`bg-background`, `text-accent`, `border-border`, etc.).
3. **App `globals.css`** files import `@kclub/ui/styles/tokens.css` and only add app-specific styles — they must not redefine core colors.
4. **UI primitives** consume semantic Tailwind utilities — no hardcoded hex or zinc values.

**Available semantic tokens:**

| Token                                 | Tailwind utility                            | Use                                                 |
| ------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| `--background`                        | `bg-background`, `text-background`          | Page background                                     |
| `--foreground`                        | `text-foreground`, `bg-foreground`          | Primary text color                                  |
| `--surface`                           | `bg-surface`                                | Card/panel background                               |
| `--surface-muted`                     | `bg-surface-muted`                          | Subdued background                                  |
| `--surface-raised`                    | `bg-surface-raised`                         | Elevated surface                                    |
| `--border`                            | `border-border`                             | Default border                                      |
| `--border-strong`                     | `border-border-strong`                      | Emphasized border                                   |
| `--primary`                           | `bg-primary`, `text-primary`                | Primary button bg                                   |
| `--primary-foreground`                | `text-primary-foreground`                   | Primary button text                                 |
| `--secondary`                         | `bg-secondary`                              | Secondary button bg                                 |
| `--accent`                            | `bg-accent`, `text-accent`, `border-accent` | Brand accent (gold)                                 |
| `--accent-hover`                      | `bg-accent-hover`, `hover:bg-accent-hover`  | Accent hover state                                  |
| `--accent-foreground`                 | `text-accent-foreground`                    | Text on accent bg                                   |
| `--muted`                             | `text-muted`                                | Muted text                                          |
| `--muted-foreground`                  | `text-muted-foreground`                     | Secondary muted text                                |
| `--destructive`                       | `text-destructive`                          | Error/destructive color                             |
| `--focus-ring`                        | `ring-focus`                                | Focus ring color                                    |
| `--focus-ring-offset`                 | `ring-offset-focus`                         | Focus ring offset color                             |
| `--radius-sm/md/lg`                   | `rounded-sm/md/lg`                          | Border radius tokens                                |
| `--duration-instant/fast/normal/slow` | `duration-instant/fast/normal/slow`         | Animation duration tokens (100ms/200ms/300ms/500ms) |
| `--ease-out/in-out/spring`            | `ease-ease-out/ease-in-out/ease-spring`     | Animation easing tokens                             |

**Rule:** Do not add new hardcoded hex values, zinc-scale colors, or rgba values for theme surfaces, borders, or accents in app code. Use the semantic tokens above. The only permitted raw color values are: `brand-*` (teal, for specific brand elements), `green-*`/`red-*`/`yellow-*` (semantic status colors from Section 2.3), and `white`/`black` for shadows and overlays.

---

## 2. Color Palette

The palette is built on two scales: **zinc** (neutral) and **brand** (premium gold accent).

### 2.1 Zinc — Neutral Scale

Zinc is the primary scale for all UI chrome: text, borders, backgrounds, and surfaces.

| Token      | Light mode use                                  | Dark mode use                           |
| ---------- | ----------------------------------------------- | --------------------------------------- |
| `zinc-50`  | Page background (very light areas)              | —                                       |
| `zinc-100` | Badge background (default variant)              | —                                       |
| `zinc-200` | Surface ring / card border                      | —                                       |
| `zinc-300` | Input ring, border, icon muted                  | Border, outline badge border            |
| `zinc-400` | Placeholder text, icon decorative               | Muted text, muted icon                  |
| `zinc-500` | —                                               | Placeholder text                        |
| `zinc-600` | Muted text (`textMuted`), ghost button text     | Muted text                              |
| `zinc-700` | Primary button hover, secondary border dark     | Input ring, secondary border            |
| `zinc-800` | —                                               | Secondary button hover bg, surface ring |
| `zinc-900` | Primary button bg, headings, labels, input text | Focus ring, page bg fills               |
| `zinc-950` | —                                               | Primary button bg, main dark bg         |

**Rule:** Do not use `gray-*`, `slate-*`, `neutral-*`, or any other neutral scale. Always use `zinc-*`.

### 2.2 Brand — Premium Gold Accent

Defined in `packages/config/tailwind/theme.ts` as custom `brand` colors.

| Token       | Value     | Use                                                       |
| ----------- | --------- | --------------------------------------------------------- |
| `brand-50`  | `#fffbeb` | Light gold background tint                                |
| `brand-100` | `#fef3c7` | Badge or highlight background                             |
| `brand-500` | `#d4af37` | Primary brand accent, links on dark bg, active indicators |
| `brand-900` | `#452a00` | Dark brand for text on light brand bg                     |

**Use brand colors sparingly** — only for primary CTAs where zinc-900 is insufficient, active/selected state indicators, brand-identity elements (logo area, club card), and success states where green is too strong.

### 2.3 Semantic Colors

| Semantic           | Light                              | Dark                                | Use                                           |
| ------------------ | ---------------------------------- | ----------------------------------- | --------------------------------------------- |
| Error / validation | `red-600`                          | `red-400`                           | `FieldError`, form errors, destructive alerts |
| Success badge      | `green-800` text / `green-100` bg  | `green-100` text / `green-900` bg   | `Badge variant="success"`                     |
| Warning            | `yellow-700` text / `yellow-50` bg | `yellow-300` text / `yellow-900` bg | Use sparingly, no component yet               |

**Do not invent new semantic colors.** If a color is needed that doesn't fit this table, raise it before implementing.

---

## 3. Typography

No custom fonts are defined — the stack relies on Tailwind's default system font stack.

### 3.1 Size Scale

| Class       | Use                                                            |
| ----------- | -------------------------------------------------------------- |
| `text-xs`   | Labels on badges, small metadata, secondary captions           |
| `text-sm`   | Body copy, form labels, button text, table cells, most UI text |
| `text-base` | Large button (`size="lg"`), intro paragraphs                   |
| `text-lg`   | Section sub-headings, card titles, `EmptyState` title          |
| `text-xl`   | Page section titles                                            |
| `text-2xl`  | Page-level headings                                            |
| `text-3xl`  | Full-page state headings (`PageState` title, `font-light`)     |

**Rule:** Do not use `text-4xl` or larger without explicit design approval. Do not use arbitrary font sizes (`text-[17px]`).

### 3.2 Weight Scale

| Class           | Use                                       |
| --------------- | ----------------------------------------- |
| `font-light`    | Large display headings only (`PageState`) |
| `font-normal`   | Default — all body text, buttons          |
| `font-medium`   | Labels, emphasis text, link text          |
| `font-semibold` | Strong section headings                   |

Do not use `font-bold` — it is heavier than the design requires.

### 3.3 Common Text Patterns

```tsx
// Muted helper text
<p className={textMuted}>Secondary information</p>
// textMuted = 'text-sm text-zinc-600 dark:text-zinc-400'

// Page-level heading
<h1 className="text-3xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">

// Section heading
<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">

// Form label — use the Label component
<Label htmlFor="name">Full name</Label>

// Link
<a className={linkClasses}>Click here</a>
// linkClasses = 'font-medium text-zinc-900 hover:text-zinc-700 hover:underline dark:text-zinc-50 dark:hover:text-zinc-300'
```

---

## 4. Spacing

Use Tailwind's default spacing scale. The project uses these standard values consistently:

| Context                              | Standard spacing                                 |
| ------------------------------------ | ------------------------------------------------ |
| Between form fields                  | `space-y-4` or `space-y-6`                       |
| Inside a `Field` (label → input gap) | `space-y-2` (built into `Field` component)       |
| Inside a card/surface                | `px-8 py-10` (built into `Surface`)              |
| Between page sections                | `space-y-8` or `gap-8`                           |
| Inside a page wrapper                | `px-4 sm:px-6 lg:px-8`                           |
| Button group gap                     | `gap-3` or `gap-4`                               |
| Empty/page state padding             | `py-16` (EmptyState), `min-h-[50vh]` (PageState) |

**Rule:** Do not use arbitrary spacing values (`mt-[22px]`). If the scale doesn't fit, use the nearest standard step.

---

## 5. Component Library (`@kclub/ui`)

All components below are available via `import { ... } from '@kclub/ui'`. **Always check this list before writing custom markup.** Creating a duplicate is a bug.

### 5.1 Component Reference

| Component    | Props / Variants                                                                               | When to use                                                            |
| ------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `Button`     | `variant`: `primary` \| `secondary` \| `ghost`; `size`: `default` \| `sm` \| `lg`; `fullWidth` | All interactive buttons. Never use raw `<button>` with inline classes  |
| `IconButton` | Standard button attrs                                                                          | Square icon-only actions (toolbar, close, etc.)                        |
| `Input`      | Standard input attrs                                                                           | All text inputs. Never style raw `<input>` manually                    |
| `Field`      | `className`                                                                                    | Wrapper for label + input + error — always wrap form fields in `Field` |
| `Label`      | Standard label attrs                                                                           | Form field labels — always use instead of raw `<label>`                |
| `FieldError` | `children` (hides if empty)                                                                    | Validation error below an input                                        |
| `Badge`      | `variant`: `default` \| `outline` \| `success`                                                 | Status chips, category tags, count indicators                          |
| `Surface`    | `className`                                                                                    | White/dark card panel — forms, auth boxes, content cards               |
| `Container`  | `className`                                                                                    | Page-width centering wrapper                                           |
| `EmptyState` | `icon`, `title`, `description`, `action`                                                       | Empty list / no results within a page section                          |
| `PageState`  | `icon`, `title`, `description`, `action`                                                       | Full-page loading error / 404 / access denied                          |
| `Skeleton`   | `className`                                                                                    | Placeholder loading shimmer — use for data fetching states             |
| `Spinner`    | `size`, `className`                                                                            | Inline loading indicator — use inside buttons or next to text          |
| `SkipLink`   | —                                                                                              | Accessibility skip-nav — place at top of layout                        |

### 5.2 Button Variant Usage

| Variant     | Use                                                                 | Never use for       |
| ----------- | ------------------------------------------------------------------- | ------------------- |
| `primary`   | The single most important action on a screen (submit, confirm, CTA) | Destructive actions |
| `secondary` | Secondary or alternative action alongside a primary                 | First/only action   |
| `ghost`     | Tertiary action, navigation, cancel, back                           | Prominent CTAs      |

**One primary button per visible form/section.** If you have two primary buttons, one of them is wrong.

### 5.3 Badge Variant Usage

| Variant   | Use                                                      |
| --------- | -------------------------------------------------------- |
| `default` | Neutral status labels (e.g. `UNDER_REVIEW`, `MEMBER`)    |
| `outline` | Low-emphasis tags, categories, optional labels           |
| `success` | Positive status (e.g. `PUBLISHED`, `ACTIVE`, `APPROVED`) |

For error/rejected status, use a `default` badge with a custom red class override via `className`. Do not add new variants to the `Badge` component without updating this document.

---

## 6. Dark Mode

Dark mode is supported across all `@kclub/ui` primitives. Rules:

- Always pair every `text-zinc-*` with a `dark:text-zinc-*` counterpart.
- Always pair every `bg-*` with a `dark:bg-*` counterpart.
- Always pair every `ring-*` with a `dark:ring-*` counterpart.
- Use `dark:` variants — never use JavaScript-driven theme switching with class manipulation.
- Never hardcode `#ffffff` or `#000000` — use Tailwind tokens.

---

## 7. Layout Patterns

### 7.1 Page Layout

```tsx
// Standard public/member page
<Container>
  <div className="py-12">
    {/* page content */}
  </div>
</Container>

// Auth / onboarding centered card
<div className="flex min-h-screen items-center justify-center px-4">
  <Surface>
    {/* form content */}
  </Surface>
</div>
```

### 7.2 Form Layout

```tsx
<form className="space-y-6">
  <Field>
    <Label htmlFor="name">Full name</Label>
    <Input id="name" name="name" />
    <FieldError>{errors.name}</FieldError>
  </Field>

  <Field>
    <Label htmlFor="phone">Phone</Label>
    <Input id="phone" name="phone" type="tel" />
    <FieldError>{errors.phone}</FieldError>
  </Field>

  <Button type="submit" fullWidth>
    Continue
  </Button>
</form>
```

### 7.3 Empty and Error States

```tsx
// Within a list section
<EmptyState
  icon={<SomeIcon size={40} />}
  title="No businesses yet"
  description="Submit your first business profile to get started."
  action={<Button>Submit business</Button>}
/>

// Full-page error or access denied
<PageState
  icon={<LockIcon size={48} />}
  title="Access denied"
  description="You need a VIP subscription to access this section."
  action={<Button>Upgrade to VIP</Button>}
/>
```

---

## 8. Icons

The project uses **`lucide-react`** as the icon library.

- Import icons from `lucide-react` only — do not use heroicons, react-icons, or SVG embeds.
- Use `size` prop for icon sizing: `size={16}` (inline), `size={20}` (button/action), `size={24}` (standard), `size={40}` (EmptyState), `size={48}` (PageState).
- Pass `aria-hidden={true}` on decorative icons.
- Pass `aria-label` on standalone icon buttons (via `IconButton`).

```tsx
import { ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'

// Decorative
<ChevronRight size={16} aria-hidden />

// In EmptyState
<EmptyState icon={<Building2 size={40} aria-hidden />} title="No businesses" />
```

---

## 9. Responsive Design

- **Mobile-first**: write base classes for mobile, use `sm:`, `md:`, `lg:` for larger screens.
- Breakpoints in use: `sm` (640px) and `lg` (1024px). Avoid `md:` and `xl:` unless specifically needed.
- Touch targets must be at least 44×44px — use `min-h-[44px] min-w-[44px]` where needed.
- Tables on mobile: prefer stacked card layout over horizontal scrolling tables.

---

## 10. Accessibility

- All interactive elements must be keyboard-reachable.
- All `<img>` elements must have `alt` text.
- All form inputs must have an associated `<Label>` (via `htmlFor` + `id`).
- Always include `<SkipLink>` at the top of app layouts.
- Focus rings are built into all `@kclub/ui` components — do not remove `focus-visible` classes.
- ARIA roles and labels must be added to custom interactive components.

---

## 11. What AI Agents Must Not Do

- **Never use `style={{}}`** inline styles unless unavoidable and commented.
- **Never use raw `<button>`** with manual classes — always use `<Button>` from `@kclub/ui`.
- **Never use raw `<input>`** with manual classes — always use `<Input>` and `<Field>`.
- **Never use raw `<label>`** — always use `<Label>`.
- **Never use color tokens outside the defined palette** (`gray-*`, `slate-*`, arbitrary hex values).
- **Never create a new primitive component** without first checking if one exists in `@kclub/ui`.
- **Never add a new `Badge` variant** in app code — extend the component in `@kclub/ui` if genuinely needed.
- **Never hardcode pixel values** in Tailwind classes (`text-[15px]`, `mt-[22px]`) — use the scale.
- **Never use `font-bold`** — use `font-semibold` at most.
- **Never import icons from heroicons, react-icons, or any library other than `lucide-react`.**
- **Never mix `tokens.ts` raw class strings with component usage** — use the component, not the token string, when a component exists.
- **Never add hardcoded hex values** (`#d4af37`, `#18181b`, `#121212`, etc.) for theme surfaces, borders, backgrounds, or accent colors in app components — use semantic tokens (`bg-accent`, `text-foreground`, `bg-surface`, etc.).
- **Never redefine core theme CSS variables** in app `globals.css` — the canonical source is `packages/ui/src/styles/tokens.css`.
- **Never use raw zinc-scale colors** (`bg-zinc-900`, `text-zinc-50`, etc.) for theme surfaces, backgrounds, or borders in new code — use semantic tokens instead. Existing zinc-scale usage in primitives is being migrated incrementally.

---

## 12. Adding New UI Components

Before adding a new component to `packages/ui/src/primitives/`:

1. Confirm the component is used in both apps or is genuinely shared.
2. Check this document and the existing primitives — it may already exist.
3. Follow the same pattern as existing primitives: props type above the function, `cn()` for class merging, dark mode variants on every color class.
4. Export from `packages/ui/src/index.ts`.
5. Update this document with the new component in the reference table (Section 5.1).

Do not add product-specific logic (API calls, state, routing) to shared UI primitives.

---

## Changelog

| Version | Date       | Summary                                                                                                                                                             |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1.1.0` | 2026-06-19 | Added semantic token architecture (Section 1.1), canonical token source in `packages/ui/src/styles/tokens.css`, enforcement rules for no hardcoded theme hex values |
| `1.0.0` | 2026-06-19 | Initial design system guide for MVP v4                                                                                                                              |
