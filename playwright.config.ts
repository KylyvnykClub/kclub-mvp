import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'product-core',
      testMatch: [
        /public-visitor\.spec\.ts/,
        /member-journey\.spec\.ts/,
        /billing-flow\.spec\.ts/,
        /business-lifecycle\.spec\.ts/,
        /introduction-flow\.spec\.ts/,
      ],
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'admin-app',
      testMatch: /staff-auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' },
    },
  ],
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  webServer: [
    {
      command: 'bun run --filter @kclub/product-core start:e2e',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:3000/api/v1/test/mock-supabase',
      },
    },
    {
      command: 'bun run --filter @kclub/admin-app-legacy start:e2e',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
