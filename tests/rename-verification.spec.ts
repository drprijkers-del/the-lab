import { test, expect } from '@playwright/test'

/**
 * These tests verify the "Ceremonies" -> "Way of Work" rename is complete.
 * No user-facing page should contain the word "Ceremonies".
 *
 * Note: Public page checks (homepage, login) are in home.spec.ts and login.spec.ts.
 * This file covers authenticated pages only (runs in the 'authenticated' project).
 */
test.describe('Rename Verification', () => {
  test('teams list has no "Ceremonies"', async ({ page }) => {
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    const text = await page.locator('body').textContent()
    expect(text).not.toContain('Ceremonies')
  })

  test('team detail page uses "Way of Work" not "Ceremonies"', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await page.waitForURL(/\/teams\/[^/]+/)
    await page.waitForLoadState('networkidle')

    const text = await page.locator('body').textContent()
    expect(text).not.toContain('Ceremonies')
    expect(text).toContain('Way of Work')
  })

  test('wow tab uses "Way of Work" labels', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await page.waitForURL(/\/teams\/[^/]+/)

    await page.getByText('Way of Work').first().click()
    await page.waitForTimeout(500)

    const text = await page.locator('body').textContent()
    expect(text).not.toContain('Ceremonies')
    expect(text).not.toContain('Ceremony Growth Path')
  })

  test('new wow session page has no "Ceremonies"', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    const href = await firstTeamLink.getAttribute('href')
    const teamId = href?.split('/teams/')[1]?.split(/[/?]/)[0]
    expect(teamId).toBeTruthy()

    await page.goto(`/teams/${teamId}/wow/new`)
    await page.waitForLoadState('networkidle')
    const text = await page.locator('body').textContent()
    expect(text).not.toContain('Ceremonies')
    expect(text).not.toContain('Ceremony')
  })
})
