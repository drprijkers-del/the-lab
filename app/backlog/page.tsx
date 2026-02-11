import { getBacklogItems, getReleaseNotes } from '@/domain/backlog/actions'
import { requireAdmin } from '@/lib/auth/admin'
import { AdminHeader } from '@/components/admin/header'
import { BacklogPageContent } from '@/components/backlog/backlog-page-content'
import { createAdminClient } from '@/lib/supabase/server'
import { isPaidTier, type SubscriptionTier } from '@/domain/billing/tiers'

export const metadata = {
  title: 'Backlog | Pulse',
  description: 'What we\'re building and what we\'ve decided',
}

export default async function BacklogPage() {
  const admin = await requireAdmin()

  const supabase = await createAdminClient()
  const { data: owner } = await supabase
    .from('admin_users')
    .select('subscription_tier')
    .eq('id', admin.id)
    .single()
  const subscriptionTier = (owner?.subscription_tier || 'free') as SubscriptionTier
  const isPro = isPaidTier(subscriptionTier)

  const [backlogItems, releases] = await Promise.all([
    getBacklogItems(),
    getReleaseNotes(),
  ])

  return (
    <>
      <AdminHeader userEmail={admin.email} userName={admin.firstName} userRole={admin.role} subscriptionTier={subscriptionTier} />
      <main className="max-w-6xl mx-auto px-4 pt-8 pb-24">
        <BacklogPageContent items={backlogItems} releases={releases} isPro={isPro} />
      </main>
    </>
  )
}
