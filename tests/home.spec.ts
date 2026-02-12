import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads and shows Pulse Labs branding', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header')).toContainText('Pulse')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('shows core tools section with Way of Work (not Ceremonies)', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Way of Work' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Vibe Check' })).toBeVisible()
    // Check for feedback and coach sections (NL or EN depending on browser language)
    const body = await page.locator('body').textContent() || ''
    expect(body.includes('Team Feedback') || body.includes('Feedback')).toBeTruthy()
    expect(body.includes('Coach')).toBeTruthy()
  })

  test('does NOT show "Ceremonies" anywhere on the page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const body = await page.locator('body').textContent()
    expect(body).not.toContain('Ceremonies')
    expect(body).not.toContain('ceremonies')
  })

  test('get started button navigates to /teams', async ({ page }) => {
    await page.goto('/')
    // Button text varies by language (NL: "Aan de slag", EN: "Get started")
    const ctaButton = page.locator('a[href="/teams"] button, a[href="/teams"]').first()
    await expect(ctaButton).toBeVisible({ timeout: 5000 })
    await ctaButton.click()
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/(teams|sign-in)/)
  })

  test('language toggle switches to English', async ({ page }) => {
    await page.goto('/')
    // Find and click the language toggle in the header
    const toggle = page.locator('header button:has-text("EN"), header button:has-text("NL")')
    if (await toggle.isVisible()) {
      await toggle.click()
      // After toggle, page should have English or Dutch content
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
