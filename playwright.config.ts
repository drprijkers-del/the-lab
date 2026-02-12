import { defineConfig, devices } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// Load .env so CLERK_SECRET_KEY is available for auth setup
const envPath = path.resolve(__dirname, '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2]
    }
  }
}

const testPort = process.env.TEST_PORT || '3000'
const testBaseUrl = process.env.TEST_BASE_URL || `http://localhost:${testPort}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: testBaseUrl,
    ignoreHTTPSErrors: !!process.env.TEST_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth setup - runs first, saves session cookie to reuse
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Authenticated tests (teams, billing, wow-session, rename-verification)
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/session.json',
      },
      dependencies: ['setup'],
      testMatch: /\/(teams|billing|billing-edge-cases|wow-session|rename-verification|smoke)\.spec\.ts/,
    },
    // Public tests (no login required)
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /\/(home|login|participation)\.spec\.ts/,
    },
  ],

  webServer: {
    command: `npx next dev --port ${testPort}`,
    url: testBaseUrl,
    reuseExistingServer: true,
    timeout: 60000,
  },
})
