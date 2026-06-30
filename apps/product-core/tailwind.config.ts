import { sharedConfig } from '@kclub/config/tailwind/theme';
import type { Config } from 'tailwindcss';

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
    },
  },
  plugins: [],
};

export default config;
