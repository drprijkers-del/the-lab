'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getLanguage } from '@/lib/i18n/server'
import { ANGLES } from '@/domain/wow/types'

// ---- Types ----

export interface CrossTeamInsights {
  teamCount: number
  avgVibeScore: number | null
  avgWowScore: number | null
  weakestAngles: { angle: string; label: string; score: number }[]
  strongestAngles: { angle: string; label: string; score: number }[]
  participationRange: { lowest: number; highest: number } | null
  decliningTeams: string[]
  insights: string[]
}

// ---- Helpers ----

function getAngleLabel(angleId: string): string {
  return ANGLES.find(a => a.id === angleId)?.label || angleId
}

function buildInsightBullets(
  data: {
    teamCount: number
    avgVibeScore: number | null
    avgWowScore: number | null
    weakestAngles: { angle: string; label: string; score: number }[]
    strongestAngles: { angle: string; label: string; score: number }[]
    participationRange: { lowest: number; highest: number } | null
    decliningTeams: string[]
  },
  lang: 'nl' | 'en'
): string[] {
  const bullets: string[] = []

  if (data.avgVibeScore !== null) {
    bullets.push(lang === 'nl'
      ? `Gemiddelde Vibe over ${data.teamCount} teams: ${data.avgVibeScore}`
      : `Average Vibe across ${data.teamCount} teams: ${data.avgVibeScore}`)
  }

  if (data.weakestAngles.length > 0) {
    const w = data.weakestAngles[0]
    const count = data.teamCount
    bullets.push(lang === 'nl'
      ? `${w.label} is het zwakste angle over alle teams (${w.score})`
      : `${w.label} is the weakest angle across all teams (${w.score})`)

    if (data.weakestAngles.length >= 2) {
      const w2 = data.weakestAngles[1]
      bullets.push(lang === 'nl'
        ? `${w2.label} scoort ook laag over ${count} teams (${w2.score})`
        : `${w2.label} also scores low across ${count} teams (${w2.score})`)
    }
  }

  if (data.strongestAngles.length > 0) {
    const s = data.strongestAngles[0]
    bullets.push(lang === 'nl'
      ? `${s.label} is het sterkste angle (${s.score})`
      : `${s.label} is the strongest angle (${s.score})`)
  }

  if (data.decliningTeams.length > 0) {
    bullets.push(lang === 'nl'
      ? `${data.decliningTeams.length} team${data.decliningTeams.length > 1 ? 's tonen' : ' toont'} dalende momentum`
      : `${data.decliningTeams.length} team${data.decliningTeams.length > 1 ? 's show' : ' shows'} declining momentum`)
  }

  if (data.participationRange && data.participationRange.lowest !== data.participationRange.highest) {
    bullets.push(lang === 'nl'
      ? `Participatie verschilt sterk: ${data.participationRange.lowest}% — ${data.participationRange.highest}%`
      : `Participation varies significantly: ${data.participationRange.lowest}% — ${data.participationRange.highest}%`)
  }

  return bullets
}

// ---- Main Action ----

export async function getCrossTeamInsights(
  preferredLanguage?: 'nl' | 'en'
): Promise<CrossTeamInsights | null> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()
  const language = preferredLanguage || await getLanguage()

  // Get all teams owned by this user
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, pulse_avg_score, delta_avg_score, expected_team_size, pulse_participant_count')
    .eq('owner_id', adminUser.id)

  if (!teams || teams.length < 2) return null

  // Aggregate vibe scores
  const vibeScores = teams
    .map(t => t.pulse_avg_score ? parseFloat(String(t.pulse_avg_score)) : null)
    .filter((s): s is number => s !== null)
  const avgVibeScore = vibeScores.length > 0
    ? Math.round((vibeScores.reduce((a, b) => a + b, 0) / vibeScores.length) * 10) / 10
    : null

  // Aggregate WoW scores
  const wowScores = teams
    .map(t => t.delta_avg_score ? parseFloat(String(t.delta_avg_score)) : null)
    .filter((s): s is number => s !== null)
  const avgWowScore = wowScores.length > 0
    ? Math.round((wowScores.reduce((a, b) => a + b, 0) / wowScores.length) * 10) / 10
    : null

  // Get weakest/strongest angles across all teams from recent closed sessions
  const teamIds = teams.map(t => t.id)
  const { data: recentSessions } = await supabase
    .from('delta_sessions')
    .select('angle, overall_score, team_id')
    .in('team_id', teamIds)
    .eq('status', 'closed')
    .not('overall_score', 'is', null)
    .order('closed_at', { ascending: false })
    .limit(50)

  const angleScores: Record<string, number[]> = {}
  recentSessions?.forEach(s => {
    if (!angleScores[s.angle]) angleScores[s.angle] = []
    angleScores[s.angle].push(parseFloat(String(s.overall_score)))
  })

  const sortedAngles = Object.entries(angleScores)
    .map(([angle, scores]) => ({
      angle,
      label: getAngleLabel(angle),
      score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    }))
    .sort((a, b) => a.score - b.score)

  const weakestAngles = sortedAngles.slice(0, 3)
  const strongestAngles = sortedAngles.slice(-2).reverse()

  // Participation range
  const participations = teams
    .filter(t => t.expected_team_size && t.pulse_participant_count)
    .map(t => Math.round(((t.pulse_participant_count as number) / (t.expected_team_size as number)) * 100))
  const participationRange = participations.length >= 2
    ? { lowest: Math.min(...participations), highest: Math.max(...participations) }
    : null

  // Detect declining teams (vibe below 3.0)
  const decliningTeams = teams
    .filter(t => {
      const score = t.pulse_avg_score ? parseFloat(String(t.pulse_avg_score)) : null
      return score !== null && score < 3.0
    })
    .map(t => t.name)

  const insights = buildInsightBullets({
    teamCount: teams.length,
    avgVibeScore,
    avgWowScore,
    weakestAngles,
    strongestAngles,
    participationRange,
    decliningTeams,
  }, language)

  return {
    teamCount: teams.length,
    avgVibeScore,
    avgWowScore,
    weakestAngles,
    strongestAngles,
    participationRange,
    decliningTeams,
    insights,
  }
}
