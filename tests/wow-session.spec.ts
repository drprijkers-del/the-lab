import { test, expect } from '@playwright/test'

test.describe('Way of Work — New Session', () => {
  test('shows angle selection grid with 9 angles', async ({ page }) => {
    // Navigate to teams, get first team id
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })

    const href = await firstTeamLink.getAttribute('href')
    const teamId = href?.split('/teams/')[1]?.split(/[/?]/)[0]
    expect(teamId).toBeTruthy()

    await page.goto(`/teams/${teamId}/wow/new`)
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })

    const mainText = await page.locator('main').textContent() || ''

    // Should show Shu-Ha-Ri level badge
    expect(mainText).toMatch(/守|破|離/)

    // Should show 9 angle buttons (Scrum, Flow, Ownership, etc.)
    const angleButtons = page.locator('main button').filter({ hasNotText: /cancel|annuleren|start|terug/i })
    const count = await angleButtons.count()
    expect(count).toBeGreaterThanOrEqual(9)

    // No "Ceremonies" anywhere
    expect(mainText).not.toContain('Ceremonies')
  })

  test('selecting an angle enables the start button', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })

    const href = await firstTeamLink.getAttribute('href')
    const teamId = href?.split('/teams/')[1]?.split(/[/?]/)[0]
    expect(teamId).toBeTruthy()

    await page.goto(`/teams/${teamId}/wow/new`)
    await page.waitForLoadState('networkidle')

    // Click the first angle button in the grid
    const angleButton = page.locator('.grid button').first()
    await expect(angleButton).toBeVisible({ timeout: 5000 })
    await angleButton.click()
    await page.waitForTimeout(300)

    // Start session button should now be enabled
    const startButton = page.locator('button').filter({ hasText: /start/i }).last()
    await expect(startButton).toBeEnabled()
  })
})
