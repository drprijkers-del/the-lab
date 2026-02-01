import { getTeamsUnified } from '@/domain/teams/actions'
import { requireAdmin } from '@/lib/auth/admin'
import { AdminHeader } from '@/components/admin/header'
import { TeamsPageContent } from '@/components/teams/teams-page-content'

export default async function TeamsPage() {
  await requireAdmin()

  const teams = await getTeamsUnified()

  return (
    <>
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 pt-8 pb-24">
        <TeamsPageContent teams={teams} />
      </main>
    </>
  )
}
