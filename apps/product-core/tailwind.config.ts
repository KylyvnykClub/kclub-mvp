import { sharedConfig } from '@kclub/config/tailwind/theme';
import plugin from 'tailwindcss/plugin';
import type { Config } from 'tailwindcss';

/**
 * shadcn/ReUI components installed via the CLI are written against Tailwind v4,
 * which auto-generates bare `data-*:` variants (no brackets). This project is on
 * Tailwind v3, so these need to be registered explicitly, or their utilities
 * silently produce no CSS. The Radix UI style variant (radix-nova) reports state
 * through a single `data-state="checked"|"active"|"open"|...` attribute rather
 * than separate boolean attributes, so these variants map to that real value
 * (verified against the actual DOM output of Radix's Switch/Tabs/Select), not a
 * literal `data-checked`/`data-active` attribute name.
 */
const shadcnDataAttributeVariants = plugin(({ addVariant }) => {
  addVariant('data-checked', '&[data-state="checked"]');
  addVariant('data-unchecked', '&[data-state="unchecked"]');
  addVariant('data-active', '&[data-state="active"]');
  addVariant('data-open', '&[data-state="open"]');
  addVariant('data-closed', '&[data-state="closed"]');
  addVariant('data-disabled', '&[data-disabled]');
  addVariant('data-placeholder', '&[data-placeholder]');
  addVariant('data-horizontal', '&[data-orientation="horizontal"]');
  addVariant('data-vertical', '&[data-orientation="vertical"]');
});

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './messages/**/*.json', '../../packages/ui/src/**/*.{ts,tsx}'],
  presets: [sharedConfig],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-titillium)',
          'Titillium Web',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
        ],
      },
      colors: {
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
        },
        invert: {
          DEFAULT: 'var(--invert)',
          foreground: 'var(--invert-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
    },
  },
  plugins: [shadcnDataAttributeVariants],
};

export default config;
