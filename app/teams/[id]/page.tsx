import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTeamUnified } from '@/domain/teams/actions'
import { getTeamMetrics, getTeamInsights } from '@/domain/metrics/actions'
import { getTeamSessions } from '@/domain/delta/actions'
import { requireAdmin } from '@/lib/auth/admin'
import { AdminHeader } from '@/components/admin/header'
import { TeamDetailContent } from '@/components/teams/team-detail-content'
import { getTranslations, getLanguage } from '@/lib/i18n/server'

interface TeamPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  await requireAdmin()
  const { id } = await params
  const language = await getLanguage()
  const [team, pulseMetrics, pulseInsights, deltaSessions] = await Promise.all([
    getTeamUnified(id),
    getTeamMetrics(id),
    getTeamInsights(id, language),
    getTeamSessions(id),
  ])
  const t = await getTranslations()

  if (!team) {
    notFound()
  }

  return (
    <>
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 pt-8 pb-24">
        {/* Back link */}
        <Link
          href="/teams"
          className="inline-flex items-center text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 mb-6 min-h-11 py-2"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.adminBack}
        </Link>

        <TeamDetailContent team={team} pulseMetrics={pulseMetrics} pulseInsights={pulseInsights} deltaSessions={deltaSessions} />
      </main>
    </>
  )
}
