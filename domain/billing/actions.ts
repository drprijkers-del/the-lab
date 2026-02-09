'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getMollieClient } from '@/lib/mollie/client'
import { SequenceType } from '@mollie/api-client'
import { revalidatePath } from 'next/cache'
import { type SubscriptionTier, TIERS, isPaidTier } from './tiers'

// --- Types ---

export interface AccountBillingInfo {
  tier: SubscriptionTier
  billingStatus: string
  billingPeriodEnd: string | null
  teamCount: number
  maxTeams: number
  recentPayments: {
    id: string
    amount: string
    status: string
    paidAt: string | null
    createdAt: string
  }[]
}

// Legacy type kept for backward compatibility during transition
export interface BillingInfo {
  plan: 'free' | 'pro'
  billingStatus: string
  billingPeriodEnd: string | null
  recentPayments: {
    id: string
    amount: string
    status: string
    paidAt: string | null
    createdAt: string
  }[]
}

// --- Sync team plans from account tier ---

async function syncTeamPlansInternal(adminUserId: string, tier: SubscriptionTier, billingStatus: string): Promise<void> {
  const supabase = await createAdminClient()
  const plan = isPaidTier(tier) && (billingStatus === 'active' || billingStatus === 'cancelled') ? 'pro' : 'free'

  await supabase
    .from('teams')
    .update({ plan })
    .eq('owner_id', adminUserId)

  // On downgrade to free: reset Ha/Ri levels back to Shu
  if (plan === 'free') {
    await supabase
      .from('teams')
      .update({ wow_level: 'shu' })
      .eq('owner_id', adminUserId)
      .in('wow_level', ['ha', 'ri'])
  }
}

// --- Helper: isTeamPro (compat bridge) ---

export async function isTeamPro(teamId: string): Promise<boolean> {
  const supabase = await createAdminClient()

  const { data: team } = await supabase
    .from('teams')
    .select('owner_id, plan, billing_status, billing_period_end')
    .eq('id', teamId)
    .single()

  if (!team) return false

  // Check account-level subscription (graceful if migration 011 not yet applied)
  if (team.owner_id) {
    const { data: owner, error } = await supabase
      .from('admin_users')
      .select('subscription_tier, billing_status, billing_period_end')
      .eq('id', team.owner_id)
      .single()

    if (!error && owner?.subscription_tier && isPaidTier(owner.subscription_tier as SubscriptionTier)) {
      if (owner.billing_status === 'cancelled' && owner.billing_period_end) {
        return new Date(owner.billing_period_end) > new Date()
      }
      return owner.billing_status === 'active'
    }
  }

  // Fallback: team-level billing (legacy / pre-migration)
  if (team.plan !== 'pro') return false
  if (team.billing_status === 'cancelled' && team.billing_period_end) {
    return new Date(team.billing_period_end) > new Date()
  }
  return team.billing_status === 'active'
}

// --- Get account billing info ---

export async function getAccountBillingInfo(): Promise<AccountBillingInfo | null> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Gracefully handle missing columns (pre-migration 011)
  let tier: SubscriptionTier = 'free'
  let billingStatus = 'none'
  let billingPeriodEnd: string | null = null

  const { data: user, error: userError } = await supabase
    .from('admin_users')
    .select('subscription_tier, billing_status, billing_period_end')
    .eq('id', adminUser.id)
    .single()

  if (!userError && user) {
    tier = (user.subscription_tier || 'free') as SubscriptionTier
    billingStatus = (user.billing_status as string) || 'none'
    billingPeriodEnd = user.billing_period_end ?? null
  }

  // Count teams owned by this user
  const { count } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', adminUser.id)

  // Get recent payments (try account-level first, fall back to team-level)
  let payments: Record<string, unknown>[] = []
  const { data: accountPayments, error: payError } = await supabase
    .from('payments')
    .select('id, amount_value, status, paid_at, created_at')
    .eq('admin_user_id', adminUser.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!payError && accountPayments && accountPayments.length > 0) {
    payments = accountPayments
  } else {
    // Fallback: get payments from teams this user owns
    const { data: teams } = await supabase
      .from('teams')
      .select('id')
      .eq('owner_id', adminUser.id)

    if (teams && teams.length > 0) {
      const teamIds = teams.map((t: { id: string }) => t.id)
      const { data: teamPayments } = await supabase
        .from('payments')
        .select('id, amount_value, status, paid_at, created_at')
        .in('team_id', teamIds)
        .order('created_at', { ascending: false })
        .limit(10)
      payments = teamPayments || []
    }
  }

  return {
    tier,
    billingStatus,
    billingPeriodEnd,
    teamCount: count || 0,
    maxTeams: TIERS[tier].maxTeams,
    recentPayments: payments.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      amount: p.amount_value as string,
      status: p.status as string,
      paidAt: (p.paid_at as string) ?? null,
      createdAt: p.created_at as string,
    })),
  }
}

// Legacy: getBillingInfo for backward compatibility (billing-tab.tsx during transition)
export async function getBillingInfo(teamId: string): Promise<BillingInfo | null> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  const { data: team } = await supabase
    .from('teams')
    .select('id, owner_id, plan, billing_status, billing_period_end')
    .eq('id', teamId)
    .single()

  if (!team) return null
  if (team.owner_id !== adminUser.id && adminUser.role !== 'super_admin') {
    return null
  }

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount_value, status, paid_at, created_at')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    plan: team.plan as 'free' | 'pro',
    billingStatus: team.billing_status as string,
    billingPeriodEnd: team.billing_period_end ?? null,
    recentPayments: (payments || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      amount: p.amount_value as string,
      status: p.status as string,
      paidAt: (p.paid_at as string) ?? null,
      createdAt: p.created_at as string,
    })),
  }
}

// --- Start account subscription ---

export async function startAccountSubscription(tier: SubscriptionTier, returnUrl?: string): Promise<{
  success: boolean
  checkoutUrl?: string
  error?: string
}> {
  if (!isPaidTier(tier)) {
    return { success: false, error: 'Cannot subscribe to free tier' }
  }

  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  const { data: user } = await supabase
    .from('admin_users')
    .select('id, mollie_customer_id, subscription_tier, billing_status')
    .eq('id', adminUser.id)
    .single()

  if (!user) return { success: false, error: 'User not found' }

  // Already on this tier with active subscription
  if (user.billing_status === 'active' && user.subscription_tier === tier) {
    return { success: false, error: 'Already on this tier' }
  }

  const tierConfig = TIERS[tier]

  try {
    // Create or reuse Mollie customer
    let mollieCustomerId = user.mollie_customer_id as string | null
    if (!mollieCustomerId) {
      const customer = await getMollieClient().customers.create({
        name: adminUser.email,
        email: adminUser.email,
        metadata: JSON.stringify({ adminUserId: adminUser.id }),
      })
      mollieCustomerId = customer.id

      await supabase
        .from('admin_users')
        .update({ mollie_customer_id: mollieCustomerId })
        .eq('id', adminUser.id)
    }

    // Create first payment to establish mandate
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')
    const payment = await getMollieClient().payments.create({
      amount: { currency: 'EUR', value: tierConfig.price },
      customerId: mollieCustomerId,
      sequenceType: SequenceType.first,
      description: tierConfig.mollieDesc,
      redirectUrl: `${baseUrl}/account/billing?status=pending${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`,
      ...(!isLocalhost && { webhookUrl: `${baseUrl}/api/webhooks/mollie` }),
      metadata: JSON.stringify({ adminUserId: adminUser.id, tier, type: 'first_payment' }),
    })

    // Update billing status
    await supabase
      .from('admin_users')
      .update({ billing_status: 'pending_mandate' })
      .eq('id', adminUser.id)

    // Log payment
    await supabase.from('payments').insert({
      admin_user_id: adminUser.id,
      mollie_payment_id: payment.id,
      amount_value: tierConfig.price,
      amount_currency: 'EUR',
      status: payment.status,
      description: payment.description,
      sequence_type: 'first',
    })

    revalidatePath('/account/billing')

    const checkoutUrl = payment.getCheckoutUrl()
    return {
      success: true,
      checkoutUrl: checkoutUrl ?? undefined,
    }
  } catch (error) {
    console.error('startAccountSubscription error:', error)
    return { success: false, error: 'Failed to create checkout' }
  }
}

// --- Change subscription tier (upgrade/downgrade) ---

export async function changeSubscriptionTier(newTier: SubscriptionTier, returnUrl?: string): Promise<{
  success: boolean
  checkoutUrl?: string
  error?: string
}> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  const { data: user } = await supabase
    .from('admin_users')
    .select('id, mollie_customer_id, mollie_subscription_id, subscription_tier, billing_status')
    .eq('id', adminUser.id)
    .single()

  if (!user) return { success: false, error: 'User not found' }

  // If downgrading to free, cancel instead
  if (!isPaidTier(newTier)) {
    return cancelAccountSubscription()
  }

  // If no active subscription, start a new one
  if (user.billing_status !== 'active' || !user.mollie_subscription_id) {
    return startAccountSubscription(newTier, returnUrl)
  }

  // Cancel old subscription and start new one
  try {
    if (user.mollie_customer_id && user.mollie_subscription_id) {
      await getMollieClient().customerSubscriptions.cancel(
        user.mollie_subscription_id as string,
        { customerId: user.mollie_customer_id as string }
      )
    }

    // Clear old subscription, then start new checkout
    await supabase
      .from('admin_users')
      .update({ mollie_subscription_id: null })
      .eq('id', adminUser.id)

    return startAccountSubscription(newTier, returnUrl)
  } catch (error) {
    console.error('changeSubscriptionTier error:', error)
    return { success: false, error: 'Failed to change tier' }
  }
}

// --- Cancel account subscription ---

export async function cancelAccountSubscription(): Promise<{
  success: boolean
  error?: string
}> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  const { data: user } = await supabase
    .from('admin_users')
    .select('id, mollie_customer_id, mollie_subscription_id, billing_status')
    .eq('id', adminUser.id)
    .single()

  if (!user) return { success: false, error: 'User not found' }
  if (!user.mollie_subscription_id || !user.mollie_customer_id) {
    return { success: false, error: 'No active subscription' }
  }

  try {
    await getMollieClient().customerSubscriptions.cancel(
      user.mollie_subscription_id as string,
      { customerId: user.mollie_customer_id as string }
    )

    // Keep tier until billing_period_end
    await supabase
      .from('admin_users')
      .update({
        billing_status: 'cancelled',
        mollie_subscription_id: null,
      })
      .eq('id', adminUser.id)

    revalidatePath('/account/billing')
    return { success: true }
  } catch (error) {
    console.error('cancelAccountSubscription error:', error)
    return { success: false, error: 'Failed to cancel subscription' }
  }
}

// --- Sync team plans (exported for webhook) ---

export async function syncTeamPlans(adminUserId: string, tier: SubscriptionTier, billingStatus: string): Promise<void> {
  return syncTeamPlansInternal(adminUserId, tier, billingStatus)
}

// --- Legacy: per-team subscription (kept for backward compat during transition) ---

export async function startSubscription(teamId: string): Promise<{
  success: boolean
  checkoutUrl?: string
  error?: string
}> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  const { data: team } = await supabase
    .from('teams')
    .select('id, name, owner_id, mollie_customer_id, plan')
    .eq('id', teamId)
    .single()

  if (!team) return { success: false, error: 'Team not found' }
  if (team.owner_id !== adminUser.id && adminUser.role !== 'super_admin') {
    return { success: false, error: 'Access denied' }
  }
  if (team.plan === 'pro') {
    return { success: false, error: 'Team already on Pro plan' }
  }

  try {
    let mollieCustomerId = team.mollie_customer_id as string | null
    if (!mollieCustomerId) {
      const customer = await getMollieClient().customers.create({
        name: team.name as string,
        email: adminUser.email,
        metadata: JSON.stringify({ teamId, adminUserId: adminUser.id }),
      })
      mollieCustomerId = customer.id

      await supabase
        .from('teams')
        .update({ mollie_customer_id: mollieCustomerId })
        .eq('id', teamId)
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')
    const payment = await getMollieClient().payments.create({
      amount: { currency: 'EUR', value: '9.99' },
      customerId: mollieCustomerId,
      sequenceType: SequenceType.first,
      description: `Pulse Labs Pro - ${team.name}`,
      redirectUrl: `${baseUrl}/teams/${teamId}?tab=billing&status=pending`,
      ...(!isLocalhost && { webhookUrl: `${baseUrl}/api/webhooks/mollie` }),
      metadata: JSON.stringify({ teamId, type: 'first_payment' }),
    })

    await supabase
      .from('teams')
      .update({ billing_status: 'pending_mandate' })
      .eq('id', teamId)

    await supabase.from('payments').insert({
      team_id: teamId,
      mollie_payment_id: payment.id,
      amount_value: '9.99',
      amount_currency: 'EUR',
      status: payment.status,
      description: payment.description,
      sequence_type: 'first',
    })

    revalidatePath(`/teams/${teamId}`)

    const checkoutUrl = payment.getCheckoutUrl()
    return {
      success: true,
      checkoutUrl: checkoutUrl ?? undefined,
    }
  } catch (error) {
    console.error('startSubscription error:', error)
    return { success: false, error: 'Failed to create checkout' }
  }
}

export async function cancelSubscription(teamId: string): Promise<{
  success: boolean
  error?: string
}> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  const { data: team } = await supabase
    .from('teams')
    .select('id, owner_id, mollie_customer_id, mollie_subscription_id, billing_status')
    .eq('id', teamId)
    .single()

  if (!team) return { success: false, error: 'Team not found' }
  if (team.owner_id !== adminUser.id && adminUser.role !== 'super_admin') {
    return { success: false, error: 'Access denied' }
  }
  if (!team.mollie_subscription_id || !team.mollie_customer_id) {
    return { success: false, error: 'No active subscription' }
  }

  try {
    await getMollieClient().customerSubscriptions.cancel(
      team.mollie_subscription_id as string,
      { customerId: team.mollie_customer_id as string }
    )

    await supabase
      .from('teams')
      .update({
        billing_status: 'cancelled',
        mollie_subscription_id: null,
      })
      .eq('id', teamId)

    revalidatePath(`/teams/${teamId}`)
    return { success: true }
  } catch (error) {
    console.error('cancelSubscription error:', error)
    return { success: false, error: 'Failed to cancel subscription' }
  }
}
