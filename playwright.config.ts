import { config as loadEnv } from 'dotenv'
import { defineConfig, devices } from '@playwright/test'

loadEnv({ path: '.env.local' })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    storageState: 'e2e/.auth/session.json',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev -- --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
})
