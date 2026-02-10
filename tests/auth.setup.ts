import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const authFile = 'tests/.auth/session.json'

// Ensure directory exists
fs.mkdirSync(path.dirname(authFile), { recursive: true })

/**
 * Authenticate once before all authenticated tests.
 * Uses Clerk Backend API sign-in tokens to bypass login form + 2FA.
 *
 * Requires environment variables:
 *   TEST_ADMIN_EMAIL - admin email address
 *   CLERK_SECRET_KEY - Clerk secret key (from .env)
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL
  const secretKey = process.env.CLERK_SECRET_KEY

  if (!email || !secretKey) {
    throw new Error(
      'Set TEST_ADMIN_EMAIL and CLERK_SECRET_KEY to run authenticated tests.\n' +
      'Example: TEST_ADMIN_EMAIL=you@example.com npx playwright test'
    )
  }

  // Step 1: Find user by email via Clerk Backend API
  const usersRes = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}&limit=1`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  )
  if (!usersRes.ok) {
    throw new Error(`Clerk API error finding user: ${usersRes.status} ${await usersRes.text()}`)
  }
  const users = await usersRes.json()
  const userId = users[0]?.id
  if (!userId) throw new Error(`No Clerk user found for ${email}`)

  // Step 2: Create a sign-in token (bypasses all auth factors including 2FA)
  const tokenRes = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 300 }),
  })
  if (!tokenRes.ok) {
    throw new Error(`Failed to create sign-in token: ${tokenRes.status} ${await tokenRes.text()}`)
  }
  const tokenData = await tokenRes.json()
  const ticket = tokenData.token
  if (!ticket) throw new Error('Sign-in token was empty')

  // Step 3: Navigate to app and wait for Clerk to load
  await page.goto('/')
  await page.waitForFunction(
    () => {
      const clerk = (window as unknown as Record<string, unknown>).Clerk as
        { loaded?: boolean } | undefined
      return clerk?.loaded === true
    },
    { timeout: 20000 }
  )

  // Step 4: Sign in using the ticket strategy (bypasses login form + 2FA)
  const status = await page.evaluate(async (t: string) => {
    const clerk = (window as unknown as Record<string, unknown>).Clerk as {
      client: { signIn: { create: (opts: Record<string, string>) => Promise<{ status: string; createdSessionId: string }> } }
      setActive: (opts: { session: string }) => Promise<void>
    }
    const result = await clerk.client.signIn.create({
      strategy: 'ticket',
      ticket: t,
    })
    if (result.status === 'complete') {
      await clerk.setActive({ session: result.createdSessionId })
      return 'complete'
    }
    return result.status
  }, ticket)

  if (status !== 'complete') {
    throw new Error(`Ticket sign-in failed with status: ${status}`)
  }

  // Step 5: Navigate to /teams to verify authentication
  await page.goto('/teams')
  await expect(page).toHaveURL(/\/teams/, { timeout: 15000 })

  // Step 6: Save session state (cookies + localStorage) for reuse
  await page.context().storageState({ path: authFile })
})
