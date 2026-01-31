import Link from 'next/link'
import { getTeamsUnified } from '@/domain/teams/actions'
import { requireAdmin } from '@/lib/auth/admin'
import { AdminHeader } from '@/components/admin/header'
import { TeamsListContent } from '@/components/teams/teams-list-content'
import { Button } from '@/components/ui/button'
import { getTranslations } from '@/lib/i18n/server'

export default async function TeamsPage() {
  await requireAdmin()
  const teams = await getTeamsUnified()
  const t = await getTranslations()

  return (
    <>
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 pt-8 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t.teamsTitle}</h1>
            <p className="text-stone-600 dark:text-stone-400 mt-1">{t.teamsSubtitle}</p>
          </div>
          <Link href="/teams/new" className="shrink-0">
            <Button className="w-full sm:w-auto">{t.teamsNewTeam}</Button>
          </Link>
        </div>

        <TeamsListContent teams={teams} />
      </main>
    </>
  )
}
