import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests of the running app (docker compose up: client on 5173, API
 * on 3000, seeded demo data). E2E_BASE_URL points them somewhere else.
 */
export default defineConfig({
  testDir: './src',
  // The tests share the seeded project, so they run one after another.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  outputDir: '../../dist/.playwright/client-app-e2e',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
