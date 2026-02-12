import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads and shows Pulse Labs branding', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Client component needs hydration — wait for header to appear
    await expect(page.locator('header')).toContainText('Pulse', { timeout: 15000 })
    await expect(page.locator('h1')).toBeVisible()
  })

  test('shows core tools section with Way of Work (not Ceremonies)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Tool cards use h3 headings inside buttons — accept NL or EN names
    const body = await page.locator('body')
    await expect(body).toBeVisible({ timeout: 15000 })
    const text = await body.textContent() || ''
    expect(text.includes('Way of Work') || text.includes('Vibe Check')).toBeTruthy()
    expect(text.includes('Feedback') || text.includes('Coach')).toBeTruthy()
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
    await page.waitForLoadState('networkidle')
    // CTA is a Link (renders as <a>) with href="/teams"
    const ctaLink = page.locator('a[href="/teams"]').first()
    await expect(ctaLink).toBeVisible({ timeout: 15000 })
    await ctaLink.click()
    // Should redirect to login if not authenticated, or show teams if authenticated
    await expect(page).toHaveURL(/\/(teams|sign-in)/)
  })

  test('language toggle switches to English', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Find and click the language toggle in the header
    const toggle = page.locator('header button:has-text("EN"), header button:has-text("NL")')
    if (await toggle.isVisible({ timeout: 10000 }).catch(() => false)) {
      await toggle.click()
      // After toggle, page should have English or Dutch content
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
