'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { getTeamMetrics } from '@/domain/metrics/actions'
import { getTeamSessions, getTeamStats, synthesizeSession } from '@/domain/wow/actions'
import { getLanguage } from '@/lib/i18n/server'
import { TIERS, type SubscriptionTier } from '@/domain/billing/tiers'
import { createHash } from 'crypto'

// ---- Types ----

export interface CoachObservation {
  title: string
  body: string
  dataPoints: string[]
}

export interface CoachQuestion {
  question: string
  reasoning: string
}

export interface CrossTeamPattern {
  pattern: string
  teams: string[]
  suggestion: string
}

export interface CoachInsight {
  observations: CoachObservation[]
  questions: CoachQuestion[]
  crossTeamPatterns?: CrossTeamPattern[]
  language: 'nl' | 'en'
  generatedAt: string
  fromCache: boolean
}

export interface CoachStatus {
  hasNewData: boolean
  dailyGenerationsLeft: number
  cachedInsight: CoachInsight | null
}

const MAX_DAILY_GENERATIONS = 5

// ---- Helpers ----

export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  const { data } = await supabase
    .from('admin_users')
    .select('subscription_tier')
    .eq('id', adminUser.id)
    .single()

  if (!data?.subscription_tier) return 'free'
  return data.subscription_tier as SubscriptionTier
}

async function computeDataHash(teamId: string): Promise<string> {
  const supabase = await createAdminClient()

  const [latestMood, latestSession, team] = await Promise.all([
    supabase
      .from('mood_entries')
      .select('entry_date')
      .eq('team_id', teamId)
      .order('entry_date', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('delta_sessions')
      .select('closed_at')
      .eq('team_id', teamId)
      .eq('status', 'closed')
      .order('closed_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('teams')
      .select('pulse_avg_score, delta_avg_score, pulse_participant_count')
      .eq('id', teamId)
      .single(),
  ])

  const hashInput = JSON.stringify({
    lastMoodDate: latestMood.data?.entry_date || 'none',
    lastSessionDate: latestSession.data?.closed_at || 'none',
    pulseAvg: team.data?.pulse_avg_score || 0,
    deltaAvg: team.data?.delta_avg_score || 0,
    participants: team.data?.pulse_participant_count || 0,
  })

  return createHash('sha256').update(hashInput).digest('hex').substring(0, 16)
}

async function getDailyGenerationCount(teamId: string): Promise<number> {
  const supabase = await createAdminClient()
  const { data } = await supabase.rpc('get_daily_generation_count', { p_team_id: teamId })
  return data || 0
}

// ---- Public API ----

export async function getCoachStatus(teamId: string): Promise<CoachStatus> {
  await requireAdmin()
  const tier = await getSubscriptionTier()
  const supabase = await createAdminClient()

  const currentHash = await computeDataHash(teamId)

  // Get latest cached insight for this tier
  const { data: cached } = await supabase
    .from('coach_insights')
    .select('*')
    .eq('team_id', teamId)
    .eq('tier', tier)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  const dailyCount = await getDailyGenerationCount(teamId)

  let cachedInsight: CoachInsight | null = null
  if (cached) {
    const content = cached.content as Record<string, unknown>
    cachedInsight = {
      observations: (content.observations as CoachObservation[]) || [],
      questions: (content.questions as CoachQuestion[]) || [],
      crossTeamPatterns: content.crossTeamPatterns as CrossTeamPattern[] | undefined,
      language: (content.language as 'nl' | 'en') || 'nl',
      generatedAt: cached.generated_at,
      fromCache: true,
    }
  }

  return {
    hasNewData: !cached || cached.data_hash !== currentHash,
    dailyGenerationsLeft: Math.max(0, MAX_DAILY_GENERATIONS - dailyCount),
    cachedInsight,
  }
}

export async function generateCoachInsight(teamId: string): Promise<CoachInsight> {
  await requireAdmin()
  const tier = await getSubscriptionTier()
  const coachMode = TIERS[tier].coachMode

  if (coachMode !== 'ai' && coachMode !== 'ai_cross_team') {
    throw new Error('AI Coach requires Agile Coach or higher tier')
  }

  const supabase = await createAdminClient()

  // Check daily cap
  const dailyCount = await getDailyGenerationCount(teamId)
  if (dailyCount >= MAX_DAILY_GENERATIONS) {
    throw new Error('Daily generation limit reached')
  }

  // Check cache
  const currentHash = await computeDataHash(teamId)
  const { data: cached } = await supabase
    .from('coach_insights')
    .select('*')
    .eq('team_id', teamId)
    .eq('data_hash', currentHash)
    .eq('tier', tier)
    .single()

  if (cached) {
    const content = cached.content as Record<string, unknown>
    return {
      observations: (content.observations as CoachObservation[]) || [],
      questions: (content.questions as CoachQuestion[]) || [],
      crossTeamPatterns: content.crossTeamPatterns as CrossTeamPattern[] | undefined,
      language: (content.language as 'nl' | 'en') || 'nl',
      generatedAt: cached.generated_at,
      fromCache: true,
    }
  }

  // Gather team data
  const [teamData, metrics, sessions, stats] = await Promise.all([
    supabase
      .from('teams')
      .select('name, pulse_avg_score, delta_avg_score, wow_level, expected_team_size, pulse_participant_count')
      .eq('id', teamId)
      .single(),
    getTeamMetrics(teamId, 60),
    getTeamSessions(teamId),
    getTeamStats(teamId),
  ])

  const team = teamData.data
  if (!team) throw new Error('Team not found')

  // Synthesize recent closed sessions (top 3)
  const closedSessions = sessions.filter(s => s.status === 'closed').slice(0, 5)
  const syntheses = await Promise.all(
    closedSessions.slice(0, 3).map(async (s) => {
      const synth = await synthesizeSession(s.id)
      if (!synth) return null
      return {
        angle: s.angle,
        score: s.overall_score,
        strengths: synth.strengths.map(st => st.statement.text),
        tensions: synth.tensions.map(t => t.statement.text),
      }
    })
  )

  const language = await getLanguage()

  // Build structured data context
  const dataContext = JSON.stringify({
    teamName: team.name,
    vibe: metrics ? {
      weekScore: metrics.weekVibe.value,
      trend: metrics.momentum.direction,
      velocity: metrics.momentum.velocity,
      daysTrending: metrics.momentum.daysTrending,
      participation: metrics.participation.rate,
      zone: metrics.weekVibe.zone,
      maturity: metrics.maturity.level,
    } : null,
    wow: {
      totalSessions: stats.totalSessions,
      averageScore: stats.averageScore,
      trend: stats.trend,
      trendDrivers: stats.trendDrivers,
      recentScores: stats.recentScores.slice(0, 5),
      sessionsByAngle: stats.sessionsByAngle,
      level: team.wow_level || 'shu',
    },
    recentSessionDetails: syntheses.filter(Boolean),
  }, null, 2)

  const systemPrompt = language === 'nl'
    ? `Je bent een ervaren Agile Coach die teamdata analyseert voor een Scrum Master of Agile Coach. Je geeft observaties met data-onderbouwing en stelt gerichte coachingvragen. Wees beknopt, concreet en actiegericht. Geen bullet-point lijstjes — schrijf als een coach die naast iemand zit. Schrijf in het Nederlands. Antwoord ALLEEN in valid JSON.`
    : `You are an experienced Agile Coach analyzing team data for a Scrum Master or Agile Coach. You provide observations backed by data and ask targeted coaching questions. Be concise, specific, and action-oriented. No bullet-point lists — write like a coach sitting next to someone. Write in English. Respond ONLY in valid JSON.`

  const userPrompt = `Analyze this team's data and provide coaching insights.

Team data:
${dataContext}

Provide:
- 1-2 observations with supporting data points (cite specific numbers from the data)
- 2-3 targeted coaching questions with brief reasoning for why each question is relevant now

Output format (strict JSON, no markdown):
{
  "observations": [{ "title": "short title", "body": "observation text with data references", "dataPoints": ["specific metric 1", "specific metric 2"] }],
  "questions": [{ "question": "the coaching question", "reasoning": "why this question matters now for this team" }]
}`

  // Call Claude Haiku
  const client = getAnthropicClient()
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Parse response
  const responseText = response.content
    .filter(block => block.type === 'text')
    .map(block => 'text' in block ? block.text : '')
    .join('')

  let parsed: { observations: CoachObservation[]; questions: CoachQuestion[] }
  try {
    const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    parsed = JSON.parse(jsonStr)
  } catch {
    const match = responseText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Failed to parse AI response')
    parsed = JSON.parse(match[0])
  }

  if (!parsed.observations || !parsed.questions) {
    throw new Error('Invalid AI response structure')
  }

  // Cache the result
  const content = { ...parsed, language }
  await supabase.from('coach_insights').upsert({
    team_id: teamId,
    data_hash: currentHash,
    tier,
    content,
    generation_count: 1,
    generated_at: new Date().toISOString(),
  }, {
    onConflict: 'team_id,data_hash,tier',
  })

  return {
    ...parsed,
    language,
    generatedAt: new Date().toISOString(),
    fromCache: false,
  }
}

export async function generateCrossTeamInsights(): Promise<CrossTeamPattern[]> {
  const adminUser = await requireAdmin()
  const tier = await getSubscriptionTier()

  if (TIERS[tier].coachMode !== 'ai_cross_team') {
    throw new Error('Cross-team insights require Transition Coach tier')
  }

  const supabase = await createAdminClient()

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, pulse_avg_score, delta_avg_score, wow_level')
    .eq('owner_id', adminUser.id)

  if (!teams || teams.length < 2) return []

  // Gather stats for each team
  const teamSummaries = await Promise.all(
    teams.map(async (team) => {
      const stats = await getTeamStats(team.id)
      return {
        name: team.name,
        vibeScore: team.pulse_avg_score,
        wowScore: team.delta_avg_score,
        level: team.wow_level || 'shu',
        trend: stats.trend,
        trendDrivers: stats.trendDrivers,
        weakAngles: Object.entries(stats.sessionsByAngle)
          .filter(([, data]) => data.avgScore !== null && (data.avgScore as number) < 3.0)
          .map(([angle]) => angle),
      }
    })
  )

  const language = await getLanguage()
  const client = getAnthropicClient()

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 768,
    system: language === 'nl'
      ? 'Je bent een Agile Transition Coach. Analyseer patronen over meerdere teams. Wees concreet en verwijs naar specifieke teams en data. Antwoord ALLEEN in een valid JSON array.'
      : 'You are an Agile Transition Coach. Analyze patterns across multiple teams. Be specific and reference team names and data. Respond ONLY in a valid JSON array.',
    messages: [{
      role: 'user',
      content: `Find cross-team patterns in this data. Return 1-3 patterns.

Teams: ${JSON.stringify(teamSummaries, null, 2)}

Format: [{ "pattern": "description of the pattern", "teams": ["team name 1", "team name 2"], "suggestion": "what to do about it" }]`,
    }],
  })

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => 'text' in block ? block.text : '')
    .join('')

  try {
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(jsonStr)
  } catch {
    return []
  }
}
