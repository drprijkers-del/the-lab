import { notFound } from 'next/navigation'
import { getTeamUnified, getTeamsUnified } from '@/domain/teams/actions'
import { getTeamMetrics, getTeamInsights } from '@/domain/metrics/actions'
import { getPublicWowStats } from '@/domain/metrics/public-actions'
import { getTeamSessions } from '@/domain/wow/actions'
import { requireAdmin } from '@/lib/auth/admin'
import { AdminHeader } from '@/components/admin/header'
import { TeamDetailContent } from '@/components/teams/team-detail-content'
import { getLanguage } from '@/lib/i18n/server'
import { getSubscriptionTier } from '@/domain/coach/actions'

interface TeamPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  const admin = await requireAdmin()
  const { id } = await params
  const language = await getLanguage()
  // First fetch team to determine plan, then fetch metrics with correct trend window
  const [teamData, allTeams] = await Promise.all([
    getTeamUnified(id),
    getTeamsUnified(),
  ])

  if (!teamData) {
    notFound()
  }

  // Pro teams get 60 days of trend data (30 + 30 previous), free gets 14 (7 + 7)
  const trendDays = teamData.plan === 'pro' ? 60 : 14

  const [team, vibeMetrics, vibeInsights, wowSessions, wowStats, subscriptionTier] = await Promise.all([
    Promise.resolve(teamData),
    getTeamMetrics(id, trendDays),
    getTeamInsights(id, language),
    getTeamSessions(id),
    getPublicWowStats(id),
    getSubscriptionTier(),
  ])

  // Prepare team list for header selector
  const teamList = allTeams.map(t => ({ id: t.id, name: t.name, slug: t.slug }))

  return (
    <>
      <AdminHeader
        currentTeam={{ id: team.id, name: team.name, slug: team.slug }}
        allTeams={teamList}
        userEmail={admin.email}
        userName={admin.firstName}
        userRole={admin.role}
      />
      <main className="max-w-6xl mx-auto px-4 pt-6 pb-24">
        <TeamDetailContent team={team} vibeMetrics={vibeMetrics} vibeInsights={vibeInsights} wowSessions={wowSessions} wowStats={wowStats} subscriptionTier={subscriptionTier} />
      </main>
    </>
  )
}
