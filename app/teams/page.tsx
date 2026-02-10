import { getTeamsUnified } from '@/domain/teams/actions'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/header'
import { TeamsPageContent } from '@/components/teams/teams-page-content'

export interface TeamOwner {
  id: string
  email: string
}

export default async function TeamsPage() {
  const admin = await requireAdmin()

  const teams = await getTeamsUnified()

  // For super admins, fetch owners to populate the account filter dropdown
  let owners: TeamOwner[] = []
  if (admin.role === 'super_admin') {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('admin_users')
      .select('id, email')
      .order('email')
    owners = (data ?? []) as TeamOwner[]
  }

  return (
    <>
      <AdminHeader userEmail={admin.email} userName={admin.firstName} userRole={admin.role} />
      <main className="max-w-6xl mx-auto px-4 pt-8 pb-24">
        <TeamsPageContent teams={teams} owners={owners} userRole={admin.role} currentUserId={admin.id} />
      </main>
    </>
  )
}
