import { test, expect } from '@playwright/test'

test.describe('Participation Page (public)', () => {
  test('invalid session code shows error', async ({ page }) => {
    await page.goto('/d/INVALID123')
    await page.waitForLoadState('networkidle')
    // Should show invalid session message
    const body = await page.locator('body').textContent() || ''
    const isInvalid = body.includes('invalid') || body.includes('Invalid') ||
      body.includes('niet gevonden') || body.includes('not found') ||
      body.includes('ongeldig') || body.includes('verlopen') || body.includes('expired')
    expect(isInvalid).toBeTruthy()
  })

  test('participation page does not contain "Ceremonies"', async ({ page }) => {
    await page.goto('/d/INVALID123')
    await page.waitForLoadState('networkidle')
    const body = await page.locator('body').textContent() || ''
    expect(body).not.toContain('Ceremonies')
  })
})
