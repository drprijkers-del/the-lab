import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTeam } from '@/domain/teams/actions'
import { getTeamSessions, getTeamStats } from '@/domain/delta/actions'
import { requireAdmin } from '@/lib/auth/admin'
import { AdminHeader } from '@/components/admin/header'
import { DeltaTeamContent } from '@/components/teams/delta-team-content'

interface TeamDeltaPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamDeltaPage({ params }: TeamDeltaPageProps) {
  await requireAdmin()
  const { id } = await params

  const [team, sessions, stats] = await Promise.all([
    getTeam(id),
    getTeamSessions(id),
    getTeamStats(id),
  ])

  if (!team) {
    notFound()
  }

  return (
    <>
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 pt-8 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 mb-6">
          <Link href="/teams" className="hover:text-stone-700 dark:hover:text-stone-200">Teams</Link>
          <span>/</span>
          <Link href={`/teams/${id}`} className="hover:text-stone-700 dark:hover:text-stone-200">{team.name}</Link>
          <span>/</span>
          <span className="text-stone-900 dark:text-stone-100">Delta</span>
        </div>

        <DeltaTeamContent
          team={team}
          sessions={sessions}
          stats={stats}
          basePath={`/teams/${id}`}
        />
      </main>
    </>
  )
}
