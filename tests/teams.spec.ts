import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('Teams (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('teams list page loads', async ({ page }) => {
    await page.goto('/teams')
    await expect(page).toHaveURL(/\/teams/)
    // Should show the teams page content (header or team cards)
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Team Detail (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('team detail home tab shows tool cards', async ({ page }) => {
    // Go to teams list first to find a team
    await page.goto('/teams')
    // Click the first team link
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    if (await firstTeamLink.isVisible({ timeout: 5000 })) {
      await firstTeamLink.click()
      await expect(page).toHaveURL(/\/teams\/[^/]+/)

      // Home tab should show Vibe and Way of Work cards
      await expect(page.getByText('Vibe')).toBeVisible({ timeout: 10000 })
      await expect(page.getByText('Way of Work')).toBeVisible()

      // No "Ceremonies" text
      const main = await page.locator('main').textContent()
      expect(main).not.toContain('Ceremonies')
    }
  })

  test('team detail wow tab shows Way of Work content', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    if (await firstTeamLink.isVisible({ timeout: 5000 })) {
      await firstTeamLink.click()
      await page.waitForURL(/\/teams\/[^/]+/)

      // Navigate to wow tab
      await page.getByText('Way of Work').first().click()
      await page.waitForTimeout(500)

      // Should show Way of Work related content
      await expect(page.locator('main')).toBeVisible()
      // Shu-Ha-Ri section should be visible
      const mainText = await page.locator('main').textContent()
      expect(mainText).toContain('守') // Shu kanji
    }
  })

  test('team detail settings tab shows tool toggles', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    if (await firstTeamLink.isVisible({ timeout: 5000 })) {
      await firstTeamLink.click()
      await page.waitForURL(/\/teams\/[^/]+/)

      // Navigate to settings
      const settingsButton = page.locator('button, a').filter({ hasText: /settings|instellingen/i }).first()
      if (await settingsButton.isVisible({ timeout: 3000 })) {
        await settingsButton.click()
        await page.waitForTimeout(500)

        // Settings should show "Way of Work" tool toggle, not "Ceremonies"
        const mainText = await page.locator('main').textContent()
        expect(mainText).toContain('Way of Work')
        expect(mainText).not.toContain('Ceremonies')
      }
    }
  })
})
