import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

// DEV ONLY — simulate billing state changes for local testing
// Usage: POST /api/dev/billing-sim { "action": "activate" | "reset" | "cancel" | "pending" | "set_tier", "tier"?: "scrum_master" | "agile_coach" | "transition_coach" }

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 })
  }

  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()
  const { action, tier } = await request.json()

  const userId = adminUser.id

  switch (action) {
    case 'activate': {
      const activeTier = tier || 'scrum_master'
      await supabase
        .from('admin_users')
        .update({
          subscription_tier: activeTier,
          billing_status: 'active',
          billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', userId)

      await supabase
        .from('teams')
        .update({ plan: 'pro' })
        .eq('owner_id', userId)

      return NextResponse.json({ ok: true, state: `active / ${activeTier}` })
    }

    case 'set_tier': {
      const validTiers = ['scrum_master', 'agile_coach', 'transition_coach']
      if (!tier || !validTiers.includes(tier)) {
        return NextResponse.json({ error: 'Provide tier: scrum_master | agile_coach | transition_coach' }, { status: 400 })
      }
      await supabase
        .from('admin_users')
        .update({
          subscription_tier: tier,
          billing_status: 'active',
          billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', userId)

      await supabase
        .from('teams')
        .update({ plan: 'pro' })
        .eq('owner_id', userId)

      return NextResponse.json({ ok: true, state: `active / ${tier}` })
    }

    case 'reset': {
      await supabase
        .from('admin_users')
        .update({
          subscription_tier: 'free',
          billing_status: 'none',
          billing_period_end: null,
          mollie_customer_id: null,
          mollie_subscription_id: null,
        })
        .eq('id', userId)

      await supabase
        .from('teams')
        .update({ plan: 'free' })
        .eq('owner_id', userId)

      return NextResponse.json({ ok: true, state: 'free / none' })
    }

    case 'pending': {
      await supabase
        .from('admin_users')
        .update({
          billing_status: 'pending_mandate',
        })
        .eq('id', userId)

      return NextResponse.json({ ok: true, state: 'pending_mandate' })
    }

    case 'cancel': {
      await supabase
        .from('admin_users')
        .update({
          billing_status: 'cancelled',
          billing_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', userId)

      return NextResponse.json({ ok: true, state: 'cancelled' })
    }

    default:
      return NextResponse.json({ error: 'Unknown action. Use: activate, reset, pending, cancel' }, { status: 400 })
  }
}
