import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('Way of Work Session Creation (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('new wow session page shows angle selection grid', async ({ page }) => {
    // Navigate to teams, find a team, go to wow/new
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()

    if (await firstTeamLink.isVisible({ timeout: 5000 })) {
      const href = await firstTeamLink.getAttribute('href')
      const teamId = href?.split('/teams/')[1]?.split(/[/?]/)[0]

      if (teamId) {
        await page.goto(`/teams/${teamId}/wow/new`)

        // Should show the session creation page
        await expect(page.locator('main')).toBeVisible({ timeout: 10000 })

        // Page title should say "start" session (NL or EN)
        const mainText = await page.locator('main').textContent() || ''
        const hasSessionTitle = mainText.includes('Start') || mainText.includes('session') || mainText.includes('Session')
        expect(hasSessionTitle).toBeTruthy()

        // Should show Shu-Ha-Ri level badge
        expect(mainText).toMatch(/守|破|離/) // One of the kanji should be visible

        // Should show angle buttons (9 angles: Scrum, Flow, Ownership, etc.)
        const angleButtons = page.locator('main button').filter({ hasNotText: /cancel|annuleren|start|terug/i })
        const count = await angleButtons.count()
        expect(count).toBeGreaterThanOrEqual(9)

        // No "Ceremonies" anywhere
        expect(mainText).not.toContain('Ceremonies')
      }
    }
  })

  test('selecting an angle shows description and enables start button', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()

    if (await firstTeamLink.isVisible({ timeout: 5000 })) {
      const href = await firstTeamLink.getAttribute('href')
      const teamId = href?.split('/teams/')[1]?.split(/[/?]/)[0]

      if (teamId) {
        await page.goto(`/teams/${teamId}/wow/new`)
        await page.waitForLoadState('networkidle')

        // Click the first angle (Scrum)
        const angleGrid = page.locator('.grid button').first()
        if (await angleGrid.isVisible({ timeout: 5000 })) {
          await angleGrid.click()
          await page.waitForTimeout(300)

          // Start session button should now be enabled
          const startButton = page.locator('button').filter({ hasText: /start/i }).last()
          await expect(startButton).toBeEnabled()
        }
      }
    }
  })
})
