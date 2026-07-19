import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'line',
  timeout: 10_000,
  use: {
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
});
