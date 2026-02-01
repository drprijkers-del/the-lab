import { getBacklogItems, getReleaseNotes } from '@/domain/backlog/actions'
import { requireAdmin } from '@/lib/auth/admin'
import { AdminHeader } from '@/components/admin/header'
import { BacklogPageContent } from '@/components/backlog/backlog-page-content'

export const metadata = {
  title: 'Backlog | Pulse',
  description: 'What we\'re building and what we\'ve decided',
}

export default async function BacklogPage() {
  await requireAdmin()

  const [backlogItems, releases] = await Promise.all([
    getBacklogItems(),
    getReleaseNotes(),
  ])

  return (
    <>
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 pt-8 pb-24">
        <BacklogPageContent items={backlogItems} releases={releases} />
      </main>
    </>
  )
}
