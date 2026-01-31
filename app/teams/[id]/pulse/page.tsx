import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTeam } from '@/domain/teams/actions'
import { getTeamMetrics, getTeamInsights, getFlyFrequency } from '@/domain/metrics/actions'
import { requireAdmin } from '@/lib/auth/admin'
import { AdminHeader } from '@/components/admin/header'
import { TeamDetailContent } from '@/components/admin/team-detail-content'
import { getTranslations } from '@/lib/i18n/server'

interface TeamPulsePageProps {
  params: Promise<{ id: string }>
}

export default async function TeamPulsePage({ params }: TeamPulsePageProps) {
  await requireAdmin()
  const { id } = await params
  const t = await getTranslations()

  const [team, metrics, insights, flyFrequency] = await Promise.all([
    getTeam(id),
    getTeamMetrics(id),
    getTeamInsights(id),
    getFlyFrequency(id),
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
          <span className="text-stone-900 dark:text-stone-100">Pulse</span>
        </div>

        <TeamDetailContent
          team={team}
          metrics={metrics}
          insights={insights}
          flyFrequency={flyFrequency}
        />
      </main>
    </>
  )
}
