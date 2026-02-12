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
import { getCrossTeamInsights } from '@/domain/coach/cross-team'
import { ensurePlanSync } from '@/domain/billing/actions'
import { getFeaturesForTier } from '@/domain/billing/tiers'

interface TeamPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  const admin = await requireAdmin()
  const { id } = await params
  const language = await getLanguage()
  // Ensure team plans match subscription tier (auto-heals webhook misses)
  await ensurePlanSync()

  // First batch: team data + subscription tier (needed for trendDays computation)
  const [teamData, allTeams, subscriptionTier] = await Promise.all([
    getTeamUnified(id),
    getTeamsUnified(),
    getSubscriptionTier(),
  ])

  if (!teamData) {
    notFound()
  }

  const features = getFeaturesForTier(subscriptionTier)
  // Trend window: features.trendDays (7 or 30) × 2 for current + previous period
  const trendDays = features.trendDays * 2

  // Second batch: metrics, sessions, and conditional cross-team data
  const [team, vibeMetrics, vibeInsights, wowSessions, wowStats, crossTeamData] = await Promise.all([
    Promise.resolve(teamData),
    getTeamMetrics(id, trendDays),
    getTeamInsights(id, language),
    getTeamSessions(id),
    getPublicWowStats(id),
    features.crossTeam ? getCrossTeamInsights(language) : Promise.resolve(null),
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
        subscriptionTier={subscriptionTier}
      />
      <main className="max-w-6xl mx-auto px-4 pt-6 pb-24">
        <TeamDetailContent team={team} vibeMetrics={vibeMetrics} vibeInsights={vibeInsights} wowSessions={wowSessions} wowStats={wowStats} subscriptionTier={subscriptionTier} crossTeamData={crossTeamData} />
      </main>
    </>
  )
}
