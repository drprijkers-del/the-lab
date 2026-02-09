import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test('shows login form with email and password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Pulse').first()).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('fake@example.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    // Wait for Clerk error message (red error box)
    await expect(page.locator('.bg-red-50, .bg-red-900\\/30')).toBeVisible({ timeout: 20000 })
  })

  test('redirects unauthenticated /teams access to login', async ({ page }) => {
    await page.goto('/teams')
    await expect(page).toHaveURL(/\/login/)
  })
})
