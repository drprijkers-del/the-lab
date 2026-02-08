import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

/**
 * These tests verify the "Ceremonies" → "Way of Work" rename is complete.
 * No user-facing page should contain the word "Ceremonies".
 */
test.describe('Rename Verification: no "Ceremonies" in UI', () => {
  test('homepage has no "Ceremonies"', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const text = await page.locator('body').textContent()
    expect(text).not.toContain('Ceremonies')
    expect(text).not.toContain('ceremony')
  })

  test('login page has no "Ceremonies"', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const text = await page.locator('body').textContent()
    expect(text).not.toContain('Ceremonies')
  })
})

test.describe('Rename Verification: authenticated pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('teams list has no "Ceremonies"', async ({ page }) => {
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    const text = await page.locator('body').textContent()
    expect(text).not.toContain('Ceremonies')
  })

  test('team detail page uses "Way of Work" not "Ceremonies"', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    if (await firstTeamLink.isVisible({ timeout: 5000 })) {
      await firstTeamLink.click()
      await page.waitForURL(/\/teams\/[^/]+/)
      await page.waitForLoadState('networkidle')

      const text = await page.locator('body').textContent()
      expect(text).not.toContain('Ceremonies')
      expect(text).toContain('Way of Work')
    }
  })

  test('wow tab uses "Way of Work" labels', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    if (await firstTeamLink.isVisible({ timeout: 5000 })) {
      await firstTeamLink.click()
      await page.waitForURL(/\/teams\/[^/]+/)

      // Click Way of Work card to go to wow tab
      await page.getByText('Way of Work').first().click()
      await page.waitForTimeout(500)

      const text = await page.locator('body').textContent()
      expect(text).not.toContain('Ceremonies')
      expect(text).not.toContain('Ceremony Growth Path')
    }
  })

  test('new wow session page has no "Ceremonies"', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    if (await firstTeamLink.isVisible({ timeout: 5000 })) {
      const href = await firstTeamLink.getAttribute('href')
      const teamId = href?.split('/teams/')[1]?.split(/[/?]/)[0]
      if (teamId) {
        await page.goto(`/teams/${teamId}/wow/new`)
        await page.waitForLoadState('networkidle')
        const text = await page.locator('body').textContent()
        expect(text).not.toContain('Ceremonies')
        expect(text).not.toContain('Ceremony')
      }
    }
  })
})
