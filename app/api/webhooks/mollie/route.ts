import { NextRequest, NextResponse } from 'next/server'
import { getMollieClient } from '@/lib/mollie/client'
import { SequenceType } from '@mollie/api-client'
import { createServiceClient } from '@/lib/supabase/server'
import { TIERS, type SubscriptionTier } from '@/domain/billing/tiers'
import { syncTeamPlans } from '@/domain/billing/actions'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const paymentId = formData.get('id') as string

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
    }

    // Fetch payment from Mollie API (this verifies authenticity)
    const payment = await getMollieClient().payments.get(paymentId)
    const metadata = typeof payment.metadata === 'string'
      ? JSON.parse(payment.metadata)
      : (payment.metadata as Record<string, unknown> | null)

    const adminUserId = metadata?.adminUserId as string | undefined
    const teamId = metadata?.teamId as string | undefined

    // Route to account-level or legacy per-team flow
    if (adminUserId && !teamId) {
      return handleAccountPayment(payment, metadata!, adminUserId)
    } else if (teamId) {
      return handleLegacyTeamPayment(payment, teamId)
    } else {
      console.error('[mollie-webhook] No adminUserId or teamId in metadata', paymentId)
      return NextResponse.json({ error: 'Missing identifier' }, { status: 400 })
    }
  } catch (error) {
    console.error('[mollie-webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// --- Account-level billing flow ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleAccountPayment(payment: any, metadata: Record<string, unknown>, adminUserId: string) {
  const supabase = createServiceClient()
  const tier = (metadata.tier || 'scrum_master') as SubscriptionTier
  const tierConfig = TIERS[tier] || TIERS.scrum_master

  // Upsert payment record
  await supabase.from('payments').upsert(
    {
      admin_user_id: adminUserId,
      mollie_payment_id: payment.id,
      amount_value: payment.amount.value,
      amount_currency: payment.amount.currency,
      status: payment.status,
      description: payment.description ?? null,
      paid_at: payment.paidAt ?? null,
      sequence_type: payment.sequenceType ?? null,
    },
    { onConflict: 'mollie_payment_id' }
  )

  if (payment.status === 'paid') {
    if (payment.sequenceType === SequenceType.first) {
      // First payment → mandate created → create subscription
      const customerId = payment.customerId as string
      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

      const subscription = await getMollieClient().customerSubscriptions.create({
        customerId,
        amount: { currency: 'EUR', value: tierConfig.price },
        interval: '1 month',
        description: tierConfig.mollieDesc,
        webhookUrl: `${baseUrl}/api/webhooks/mollie`,
        metadata: JSON.stringify({ adminUserId, tier }),
      })

      await supabase
        .from('admin_users')
        .update({
          subscription_tier: tier,
          billing_status: 'active',
          mollie_subscription_id: subscription.id,
          billing_period_end: subscription.nextPaymentDate ?? null,
        })
        .eq('id', adminUserId)

      // Sync all owned teams to Pro
      await syncTeamPlans(adminUserId, tier, 'active')

    } else if (payment.sequenceType === SequenceType.recurring) {
      // Recurring payment → update period end
      const { data: user } = await supabase
        .from('admin_users')
        .select('mollie_customer_id, mollie_subscription_id, subscription_tier')
        .eq('id', adminUserId)
        .single()

      if (user?.mollie_customer_id && user?.mollie_subscription_id) {
        const sub = await getMollieClient().customerSubscriptions.get(
          user.mollie_subscription_id,
          { customerId: user.mollie_customer_id }
        )
        await supabase
          .from('admin_users')
          .update({
            billing_status: 'active',
            billing_period_end: sub.nextPaymentDate ?? null,
          })
          .eq('id', adminUserId)

        await syncTeamPlans(adminUserId, user.subscription_tier as SubscriptionTier, 'active')
      }
    }
  } else if (payment.status === 'failed' || payment.status === 'expired') {
    if (payment.sequenceType === SequenceType.first) {
      await supabase
        .from('admin_users')
        .update({ billing_status: 'none' })
        .eq('id', adminUserId)
    } else {
      await supabase
        .from('admin_users')
        .update({ billing_status: 'past_due' })
        .eq('id', adminUserId)
    }
  }

  return NextResponse.json({ received: true })
}

// --- Legacy per-team billing flow (kept during transition) ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleLegacyTeamPayment(payment: any, teamId: string) {
  const supabase = createServiceClient()

  // Upsert payment record
  await supabase.from('payments').upsert(
    {
      team_id: teamId,
      mollie_payment_id: payment.id,
      amount_value: payment.amount.value,
      amount_currency: payment.amount.currency,
      status: payment.status,
      description: payment.description ?? null,
      paid_at: payment.paidAt ?? null,
      sequence_type: payment.sequenceType ?? null,
    },
    { onConflict: 'mollie_payment_id' }
  )

  if (payment.status === 'paid') {
    if (payment.sequenceType === SequenceType.first) {
      const customerId = payment.customerId as string
      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

      const subscription = await getMollieClient().customerSubscriptions.create({
        customerId,
        amount: { currency: 'EUR', value: '9.99' },
        interval: '1 month',
        description: 'Pulse Labs Pro',
        webhookUrl: `${baseUrl}/api/webhooks/mollie`,
        metadata: JSON.stringify({ teamId }),
      })

      await supabase
        .from('teams')
        .update({
          plan: 'pro',
          billing_status: 'active',
          mollie_subscription_id: subscription.id,
          billing_period_end: subscription.nextPaymentDate ?? null,
        })
        .eq('id', teamId)

    } else if (payment.sequenceType === SequenceType.recurring) {
      const { data: team } = await supabase
        .from('teams')
        .select('mollie_customer_id, mollie_subscription_id')
        .eq('id', teamId)
        .single()

      if (team?.mollie_customer_id && team?.mollie_subscription_id) {
        const sub = await getMollieClient().customerSubscriptions.get(
          team.mollie_subscription_id,
          { customerId: team.mollie_customer_id }
        )
        await supabase
          .from('teams')
          .update({
            billing_status: 'active',
            billing_period_end: sub.nextPaymentDate ?? null,
          })
          .eq('id', teamId)
      }
    }
  } else if (payment.status === 'failed' || payment.status === 'expired') {
    if (payment.sequenceType === SequenceType.first) {
      await supabase
        .from('teams')
        .update({ billing_status: 'none' })
        .eq('id', teamId)
    } else {
      await supabase
        .from('teams')
        .update({ billing_status: 'past_due' })
        .eq('id', teamId)
    }
  }

  return NextResponse.json({ received: true })
}
