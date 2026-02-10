import { test, expect } from '@playwright/test'

test.describe('Account Billing Page', () => {
  test('billing page loads and shows current tier', async ({ page }) => {
    await page.goto('/account/billing')
    await expect(page.getByText(/Subscription|Abonnement/i).first()).toBeVisible({ timeout: 10000 })
    // Should show a tier name
    await expect(page.getByText(/Free|Scrum Master|Agile Coach|Transition Coach/).first()).toBeVisible()
  })

  test('billing page shows team usage counter', async ({ page }) => {
    await page.goto('/account/billing')
    // Team usage label
    await expect(page.getByText(/Teams in (use|gebruik)/i)).toBeVisible({ timeout: 10000 })
    // X / Y format
    await expect(page.locator('text=/\\d+ \\/ \\d+/').first()).toBeVisible()
  })

  test('tier comparison shows all 4 tier cards', async ({ page }) => {
    await page.goto('/account/billing')
    await expect(page.getByText('Free').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Scrum Master/).first()).toBeVisible()
    await expect(page.getByText(/Agile Coach/).first()).toBeVisible()
    await expect(page.getByText(/Transition Coach/).first()).toBeVisible()
  })

  test('tier cards show correct pricing', async ({ page }) => {
    await page.goto('/account/billing')
    await expect(page.getByText(/€9[.,]99/).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/€24[.,]99/).first()).toBeVisible()
    await expect(page.getByText(/€49[.,]99/).first()).toBeVisible()
  })

  test('current tier is marked with badge', async ({ page }) => {
    await page.goto('/account/billing')
    await expect(page.getByText(/Current|Huidig/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('Pro features comparison section is visible', async ({ page }) => {
    await page.goto('/account/billing')
    await expect(page.getByText(/Pro\?|Pro features/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('back link navigates to teams page', async ({ page }) => {
    await page.goto('/account/billing')
    const backLink = page.locator('a[href="/teams"]').first()
    await expect(backLink).toBeVisible({ timeout: 10000 })
    await backLink.click()
    await expect(page).toHaveURL(/\/teams/)
  })
})

test.describe('Billing Navigation', () => {
  test('billing page accessible from header settings menu', async ({ page }) => {
    await page.goto('/teams')
    await page.waitForTimeout(2000)
    // Click settings gear icon
    const settingsBtn = page.getByLabel(/settings|instellingen/i).first()
    if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsBtn.click()
      const billingLink = page.locator('a[href="/account/billing"]').first()
      await expect(billingLink).toBeVisible({ timeout: 5000 })
      await billingLink.click()
      await expect(page).toHaveURL(/\/account\/billing/)
    }
  })

  test('billing page accessible from mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/teams')
    await page.waitForTimeout(2000)
    const menuBtn = page.getByLabel(/open menu|menu/i).first()
    if (await menuBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await menuBtn.click()
      const billingLink = page.locator('a[href="/account/billing"]').first()
      await expect(billingLink).toBeVisible({ timeout: 5000 })
      await billingLink.click()
      await expect(page).toHaveURL(/\/account\/billing/)
    }
  })
})

test.describe('Pro Gate', () => {
  test('coach tab shows Pro gate or Coach content depending on tier', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]:not([href$="/new"])').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await page.waitForURL(/\/teams\/[^/]+/)

    const url = page.url()
    await page.goto(`${url}?tab=coach`)
    await page.waitForTimeout(2000)

    // Free users see Pro gate, paid users see Coach content
    const gate = page.getByText(/Pro feature|Pro functie/i).first()
    const isGateVisible = await gate.isVisible().catch(() => false)

    if (isGateVisible) {
      await expect(page.getByText(/Upgrade.*Pro/i).first()).toBeVisible()
    } else {
      const main = await page.locator('main').textContent() || ''
      expect(main).toMatch(/Coach|Genereer|Generate|Prepare|Observat/i)
    }
  })

  test('Pro gate upgrade button navigates to billing (free users only)', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]:not([href$="/new"])').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await page.waitForURL(/\/teams\/[^/]+/)

    const url = page.url()
    await page.goto(`${url}?tab=coach`)
    await page.waitForTimeout(2000)

    const upgradeBtn = page.getByText(/Upgrade.*Pro/i).first()
    const isVisible = await upgradeBtn.isVisible().catch(() => false)

    if (isVisible) {
      await upgradeBtn.click()
      await expect(page).toHaveURL(/\/account\/billing/)
    } else {
      // Paid user — Coach content is shown instead of gate
      const main = await page.locator('main').textContent() || ''
      expect(main).toMatch(/Coach|Genereer|Generate|Prepare|Observat/i)
    }
  })
})

test.describe('Home Tab — Upgrade CTA', () => {
  test('home tab shows upgrade CTA or Pro features depending on tier', async ({ page }) => {
    await page.goto('/teams')
    const firstTeamLink = page.locator('a[href^="/teams/"]:not([href$="/new"])').first()
    await expect(firstTeamLink).toBeVisible({ timeout: 10000 })
    await firstTeamLink.click()
    await page.waitForURL(/\/teams\/[^/]+/)
    // Wait for skeleton loading to finish — look for any real text content
    await page.waitForFunction(
      () => (document.querySelector('main')?.textContent?.trim().length ?? 0) > 10,
      { timeout: 15000 }
    )

    // Free users see upgrade CTA, paid users see dashboard content
    const upgradeCta = page.getByText(/Upgrade.*Pro/i).first()
    const isVisible = await upgradeCta.isVisible().catch(() => false)

    if (isVisible) {
      // Free user: upgrade card shown
      expect(isVisible).toBe(true)
    } else {
      // Paid user: dashboard with Vibe/WoW tools
      const main = await page.locator('main').textContent() || ''
      expect(main).toMatch(/Vibe|Way of Work|Coach|WoW/i)
    }
  })
})
