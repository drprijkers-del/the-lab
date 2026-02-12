import { test, expect } from '@playwright/test'

test.describe('Participation Page (public)', () => {
  test('invalid session code shows error or empty state', async ({ page }) => {
    await page.goto('/d/INVALID123')
    await page.waitForLoadState('networkidle')
    // Should show some indication that session is invalid — error message, 404, or redirect
    const body = await page.locator('body').textContent() || ''
    const url = page.url()
    const isHandled =
      body.includes('invalid') || body.includes('Invalid') ||
      body.includes('niet gevonden') || body.includes('not found') ||
      body.includes('ongeldig') || body.includes('verlopen') || body.includes('expired') ||
      body.includes('404') || body.includes('bestaat niet') || body.includes('does not exist') ||
      url.includes('/404') || url !== 'http://localhost:3000/d/INVALID123'
    expect(isHandled).toBeTruthy()
  })

  test('participation page does not contain "Ceremonies"', async ({ page }) => {
    await page.goto('/d/INVALID123')
    await page.waitForLoadState('networkidle')
    const body = await page.locator('body').textContent() || ''
    expect(body).not.toContain('Ceremonies')
  })
})
