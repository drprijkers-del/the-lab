import { getTeamsUnified } from '@/domain/teams/actions'
import { getBacklogItems, getReleaseNotes } from '@/domain/backlog/actions'
import { requireAdmin } from '@/lib/auth/admin'
import { AdminHeader } from '@/components/admin/header'
import { TeamsPageContent } from '@/components/teams/teams-page-content'

export default async function TeamsPage() {
  await requireAdmin()

  const [teams, backlogItems, releases] = await Promise.all([
    getTeamsUnified(),
    getBacklogItems(),
    getReleaseNotes(),
  ])

  return (
    <>
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 pt-8 pb-24">
        <TeamsPageContent
          teams={teams}
          backlogItems={backlogItems}
          releases={releases}
        />
      </main>
    </>
  )
}
