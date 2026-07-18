import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // server-only throws whenever `window` is defined (always true in jsdom)
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
  test: {
    // bun test injects Jest-style globals; @testing-library relies on a global
    // afterEach for its auto-cleanup, so keep globals on for parity
    globals: true,
    environment: 'jsdom',
    // dynamic imports of full Next page/layout modules can exceed the 5s
    // default while parallel workers share the transform cache cold
    testTimeout: 20_000,
    // next-intl ships ESM that imports 'next/navigation'; inline it so the
    // import resolves through Vite and vi.mock('next/navigation') applies
    server: {
      deps: {
        inline: [/next-intl/],
      },
    },
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000/en',
        pretendToBeVisual: true,
      },
    },
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
  },
});
