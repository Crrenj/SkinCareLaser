import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  // Bootstrap/teardown : purge des users de test périmés (@farmau.test) avant et
  // après la suite. Ces modules importent le helper service-role qui exige
  // ALLOW_E2E=1 (garde-fou D30) → la suite refuse de tourner sans opt-in. [C-19]
  globalSetup: './tests/_helpers/global-setup.ts',
  globalTeardown: './tests/_helpers/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  // Dev Turbopack cold-compile peut prendre 30s+ sur la 1ère visite d'une
  // route. 30s par défaut Playwright trop court pour un run unifié sur poste
  // froid. 1 retry en dev pour absorber la flakiness du cold-compile.
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: process.env.CI ? 'npm start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
}) 