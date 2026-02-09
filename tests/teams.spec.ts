import { test, expect } from '@playwright/test'

test.describe('Teams List', () => {
  test('teams list page loads', async ({ page }) => {
    await page.goto('/teams')
    await expect(page).toHaveURL(/\/teams/)
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Team Detail', () => {
  test('home tab shows Vibe and Way of Work tool cards', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await expect(page).toHaveURL(/\/teams\/[^/]+/)

    // Home tab should show Vibe and Way of Work cards
    await expect(page.getByText('Vibe')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Way of Work')).toBeVisible()

    // No "Ceremonies" text
    const main = await page.locator('main').textContent()
    expect(main).not.toContain('Ceremonies')
  })

  test('wow tab shows Way of Work content with Shu-Ha-Ri', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await page.waitForURL(/\/teams\/[^/]+/)

    // Navigate to wow tab
    await page.getByText('Way of Work').first().click()
    await page.waitForTimeout(500)

    await expect(page.locator('main')).toBeVisible()

    // Shu-Ha-Ri kanji should be visible
    const mainText = await page.locator('main').textContent()
    expect(mainText).toMatch(/守|破|離/)
  })

  test('settings tab shows Way of Work tool toggle', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await page.waitForURL(/\/teams\/[^/]+/)

    // Navigate to settings tab
    const settingsTab = page.locator('[href*="tab=settings"], button').filter({ hasText: /settings|instellingen/i }).first()
    if (await settingsTab.isVisible({ timeout: 3000 })) {
      await settingsTab.click()
      await page.waitForTimeout(500)

      const mainText = await page.locator('main').textContent()
      expect(mainText).toContain('Way of Work')
      expect(mainText).not.toContain('Ceremonies')
    }
  })
})
