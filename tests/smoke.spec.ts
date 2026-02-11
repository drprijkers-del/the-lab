import { test, expect } from '@playwright/test'

/**
 * Smoke Test — Release-Day Checklist (Quality Gate Part 6)
 *
 * Covers the critical end-to-end journeys:
 * 1. Login → Teams list
 * 2. Team detail → accordion sections visible
 * 3. Vibe section → share link visible
 * 4. WoW section → session creation possible
 * 5. Coach section → tier-appropriate content
 * 6. Billing page → tier cards + pricing
 */

test.describe('Smoke Test — Core Navigation', () => {
  test('1. Login redirects to teams dashboard', async ({ page }) => {
    await page.goto('/teams')
    await expect(page).toHaveURL(/\/teams/)
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
  })

  test('2. Team detail page loads with all tool cards', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]:not([href$="/new"])').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await expect(page).toHaveURL(/\/teams\/[^/]+/)

    // Core tool cards should be present
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Vibe').first()).toBeVisible()
    await expect(page.getByText('Way of Work').first()).toBeVisible()
  })
})

test.describe('Smoke Test — Vibe Check', () => {
  test('3. Vibe section shows share link', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]:not([href$="/new"])').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await page.waitForURL(/\/teams\/[^/]+/)

    // Open Vibe accordion section
    await page.getByText('Vibe').first().click()
    await page.waitForTimeout(500)

    // Share link or share button should be visible
    const shareVisible = await page.getByText(/share|deel|link/i).first().isVisible({ timeout: 5000 }).catch(() => false)
    const shareButtonVisible = await page.locator('button').filter({ hasText: /copy|kopieer|share|deel/i }).first().isVisible({ timeout: 3000 }).catch(() => false)
    expect(shareVisible || shareButtonVisible).toBeTruthy()
  })
})

test.describe('Smoke Test — Way of Work', () => {
  test('4. WoW section loads and shows sessions or new session option', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]:not([href$="/new"])').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await page.waitForURL(/\/teams\/[^/]+/)

    // Open WoW accordion section
    await page.getByText('Way of Work').first().click()
    await page.waitForTimeout(500)

    const main = await page.locator('main').textContent() || ''
    // Should show Shu-Ha-Ri level or session content
    expect(main).toMatch(/守|破|離|session|sessie|new|nieuw/i)
  })

  test('5. New WoW session page shows angle selection', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]:not([href$="/new"])').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })

    const href = await firstTeamLink.getAttribute('href')
    const teamId = href?.split('/teams/')[1]?.split(/[/?]/)[0]
    expect(teamId).toBeTruthy()

    await page.goto(`/teams/${teamId}/wow/new`)
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
    // Wait for skeleton to resolve and actual buttons to appear
    await page.waitForFunction(
      () => document.querySelectorAll('main button').length >= 3,
      { timeout: 15000 }
    )

    // Should show angle buttons
    const angleButtons = page.locator('main button').filter({ hasNotText: /cancel|annuleren|start|terug|back/i })
    const count = await angleButtons.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })
})

test.describe('Smoke Test — Coach Tab', () => {
  test('6. Coach section shows content (ProGate or AI Coach)', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]:not([href$="/new"])').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await page.waitForURL(/\/teams\/[^/]+/)

    const url = page.url()
    await page.goto(`${url}?tab=coach`)

    // Should show either ProGate (free) or Voorbereiding content (paid)
    const main = await page.locator('main').textContent() || ''
    const hasCoachContent = /Pro feature|Pro functie|Voorbereiding|Preparation|Analyseer|Analyze|Signalen|Signals|Observat|Perspectiev/i.test(main)
    expect(hasCoachContent).toBeTruthy()
  })
})

test.describe('Smoke Test — Billing', () => {
  test('7. Billing page loads with tier cards', async ({ page }) => {
    await page.goto('/account/billing')
    await expect(page.getByText(/Subscription|Abonnement/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('8. All 4 tiers displayed with correct pricing', async ({ page }) => {
    await page.goto('/account/billing')
    await expect(page.getByText('Free').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Scrum Master/).first()).toBeVisible()
    await expect(page.getByText(/Agile Coach/).first()).toBeVisible()
    await expect(page.getByText(/Transition Coach/).first()).toBeVisible()

    // Pricing
    await expect(page.getByText(/€9[.,]99/).first()).toBeVisible()
    await expect(page.getByText(/€24[.,]99/).first()).toBeVisible()
    await expect(page.getByText(/€49[.,]99/).first()).toBeVisible()
  })

  test('9. Current tier badge is shown', async ({ page }) => {
    await page.goto('/account/billing')
    await expect(page.getByText(/Current|Huidig/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('10. Team usage counter is visible', async ({ page }) => {
    await page.goto('/account/billing')
    await expect(page.getByText(/Teams in (use|gebruik)/i)).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/\\d+ \\/ \\d+/').first()).toBeVisible()
  })
})

test.describe('Smoke Test — Public Participation', () => {
  test('11. Invalid session code shows error', async ({ page }) => {
    await page.goto('/d/INVALID-CODE-12345')
    await page.waitForLoadState('networkidle')
    const content = await page.locator('body').textContent() || ''
    // Should show error or not found
    expect(content).toMatch(/not found|niet gevonden|error|invalid|ongeldig/i)
  })
})
