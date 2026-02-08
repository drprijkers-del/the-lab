import { type Page } from '@playwright/test'

/**
 * Log in via the password login API and set the session cookie.
 * Uses env vars TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD.
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

  // Call the login API directly
  const response = await page.request.post('/api/auth/login-password', {
    data: { email, password, redirect: '/teams' },
  })

  if (!response.ok()) {
    const body = await response.json()
    throw new Error(`Login failed: ${body.error || response.status()}`)
  }
}
