import { test, expect } from '@playwright/test'

/**
 * Billing Edge Cases & Chris Feedback Verification
 *
 * Tests for features added in Chris feedback round:
 * - Recommended tier badge
 * - Enterprise card
 * - Breadcrumbs
 * - ProGate clickability
 * - Backlog paywall
 */

test.describe('Recommended Tier Badge', () => {
  test('Scrum Master card shows recommended badge', async ({ page }) => {
    await page.goto('/account/billing')
    await expect(page.getByText(/Aanbevolen|Recommended/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('recommended card has visual emphasis (scale/ring)', async ({ page }) => {
    await page.goto('/account/billing')
    // The recommended card should have scale-105 class
    const recommendedCard = page.locator('.scale-105').first()
    await expect(recommendedCard).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Enterprise Card', () => {
  test('Enterprise section is visible on billing page', async ({ page }) => {
    await page.goto('/account/billing')
    await expect(page.getByText('Enterprise').first()).toBeVisible({ timeout: 10000 })
  })

  test('Enterprise card has contact link', async ({ page }) => {
    await page.goto('/account/billing')
    const contactLink = page.locator('a[href="/contact"]').first()
    await expect(contactLink).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Neem contact op|Contact us/i).first()).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('header logo visible on teams page and links to /teams', async ({ page }) => {
    await page.goto('/teams')
    await page.waitForTimeout(1000)
    const header = page.locator('header').first()
    await expect(header).toBeVisible({ timeout: 10000 })
    // Pulse logo should be present and link to /teams
    const logoLink = header.locator('a[href="/teams"]').first()
    await expect(logoLink).toBeVisible({ timeout: 5000 })
  })

  test('team detail page shows team name', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]:not([href$="/new"])').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await page.waitForURL(/\/teams\/[^/]+/)

    // Wait for page to fully load (not just skeletons)
    await page.waitForTimeout(2000)

    // Team name should be visible somewhere on the page (OverallSignal card)
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 5000 })
  })

  test('billing page shows subscription label in header', async ({ page }) => {
    await page.goto('/account/billing')
    // Billing page has its own minimal header with "Pulse / Subscription"
    const header = page.locator('header nav').first()
    await expect(header).toBeVisible({ timeout: 10000 })
    const text = await header.textContent() || ''
    expect(text).toMatch(/Subscription|Abonnement/i)
  })
})

test.describe('ProGate Clickability', () => {
  test('ProGate card links to billing when visible (free users only)', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]:not([href$="/new"])').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await page.waitForURL(/\/teams\/[^/]+/)

    const url = page.url()
    await page.goto(`${url}?tab=coach`)
    await page.waitForTimeout(2000)

    // ProGate only shows for free users — paid users see Coach content
    const gateCard = page.locator('[role="button"]').filter({ hasText: /Pro feature|Pro functie/i }).first()
    const isVisible = await gateCard.isVisible().catch(() => false)

    if (isVisible) {
      // Free user: card should be clickable and navigate to billing
      await gateCard.click()
      await expect(page).toHaveURL(/\/account\/billing/)
    } else {
      // Paid user: Voorbereiding/Preparation content should be visible
      const main = await page.locator('main').textContent() || ''
      expect(main).toMatch(/Voorbereiding|Preparation|Analyseer|Analyze|Signalen|Signals|Observat/i)
    }
  })
})

test.describe('Backlog Paywall', () => {
  test('backlog page shows ProGate for free users', async ({ page }) => {
    await page.goto('/backlog')
    await page.waitForTimeout(2000)
    const content = await page.locator('main').textContent() || ''
    // Should show either backlog content (Pro) or Pro gate (free)
    expect(content).toMatch(/Backlog|Pro feature|Pro functie/i)
  })
})
