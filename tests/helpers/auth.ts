import { type Page } from '@playwright/test'

/**
 * Log in via the password login form.
 * Uses env vars TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD.
 *
 * Note: For authenticated test projects, prefer storageState via auth.setup.ts.
 * This helper is available if you need to log in within a standalone test.
 */
export async function loginAsAdmin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL
  const password = process.env.TEST_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables to run authenticated tests.\n' +
      'Example: TEST_ADMIN_EMAIL=you@example.com TEST_ADMIN_PASSWORD=secret npx playwright test'
    )
  }

  // Navigate to login page and fill form
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()

  // Wait for redirect to /teams
  await page.waitForURL(/\/teams/, { timeout: 15000 })
}
