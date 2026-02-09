import { test as setup, expect } from '@playwright/test'

const authFile = 'tests/.auth/session.json'

/**
 * Authenticate once before all authenticated tests.
 * Uses the password login API to set the admin_password_session cookie,
 * then saves the browser state for reuse across test files.
 *
 * Requires environment variables:
 *   TEST_ADMIN_EMAIL    - admin email address
 *   TEST_ADMIN_PASSWORD - admin password
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL
  const password = process.env.TEST_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD to run authenticated tests.\n' +
      'Example: TEST_ADMIN_EMAIL=you@example.com TEST_ADMIN_PASSWORD=secret npx playwright test'
    )
  }

  // Navigate to login and submit credentials
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()

  // Wait for successful redirect to /teams
  await expect(page).toHaveURL(/\/teams/, { timeout: 15000 })

  // Save session state (cookies + localStorage) for reuse
  await page.context().storageState({ path: authFile })
})
