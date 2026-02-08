'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getTeamContext, generateToken, hashToken } from '@/lib/tenant/context'
import { getAdminUser } from '@/lib/auth/admin'
import type { TeamMetrics, DailyVibe } from './types'
import {
  buildVibeMetric,
  calculateMomentum,
  calculateTrend,
  hasMinimumData,
  calculateDayState,
  calculateWeekState,
  calculateDataMaturity,
} from './calculations'

/**
 * Get team metrics for public/team member view (authenticated via team cookie)
 * This is a read-only version that doesn't require admin login
 */
export async function getPublicTeamMetrics(directTeamId?: string): Promise<{
  metrics: TeamMetrics | null
  teamName: string | null
  error?: string
}> {
  // Use direct team ID (admin flow) or get from cookie (team member flow)
  let teamId = directTeamId
  if (!teamId) {
    const context = await getTeamContext()
    if (!context) {
      return { metrics: null, teamName: null, error: 'no_access' }
    }
    teamId = context.teamId
  }

  const supabase = await createClient()

  // Get team info including expected_team_size
  const { data: team } = await supabase
    .from('teams')
    .select('name, expected_team_size')
    .eq('id', teamId)
    .single()

  if (!team) {
    return { metrics: null, teamName: null, error: 'team_not_found' }
  }

  // Get participant count (people who have checked in)
  const { count: participantCount } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)

  const actualParticipants = participantCount || 0
  const totalParticipants = team.expected_team_size || actualParticipants

  // Get last 14 days of data for calculations
  const { data: rawHistory } = await supabase
    .rpc('get_team_trend', { p_team_id: teamId })

  const history: DailyVibe[] = (rawHistory || []).map((d: { date: string; average: number; count: number }) => ({
    date: d.date,
    average: d.average,
    count: d.count,
    participantCount: totalParticipants,
  }))

  // Get today's date
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Split data by time periods
  const todayData = history.filter(d => d.date === today)
  const yesterdayData = history.filter(d => d.date === yesterday)
  const last7Days = history.filter(d => {
    const date = new Date(d.date)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    return date >= sevenDaysAgo
  })
  const previous7Days = history.filter(d => {
    const date = new Date(d.date)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000)
    return date >= fourteenDaysAgo && date < sevenDaysAgo
  })

  // Build metrics
  const liveVibe = buildVibeMetric(todayData, yesterdayData, totalParticipants)
  const dayVibe = buildVibeMetric(yesterdayData, [], totalParticipants)
  const weekVibe = buildVibeMetric(last7Days, previous7Days, totalParticipants)
  const previousWeekVibe = buildVibeMetric(previous7Days, [], totalParticipants)

  // Calculate momentum
  const momentum = calculateMomentum(last7Days)

  // Today's participation
  const todayEntries = todayData.reduce((sum, d) => sum + d.count, 0)
  const yesterdayEntries = yesterdayData.reduce((sum, d) => sum + d.count, 0)
  const participationRate = totalParticipants > 0 ? Math.round((todayEntries / totalParticipants) * 100) : 0

  // Day and week state calculations
  const dayState = calculateDayState(participationRate)

  // Count unique days with data in this week
  const uniqueDaysThisWeek = new Set(last7Days.map(d => d.date)).size
  const dayOfWeek = new Date().getDay()
  const isEndOfWeek = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0
  const weekState = calculateWeekState(uniqueDaysThisWeek, isEndOfWeek)

  // Data maturity calculation
  const totalDaysWithData = history.length
  const daysWithGoodParticipation = history.filter(d =>
    totalParticipants > 0 && (d.count / totalParticipants) >= 0.3
  ).length
  const consistencyRate = totalDaysWithData > 0
    ? Math.round((daysWithGoodParticipation / totalDaysWithData) * 100)
    : 0
  const maturityLevel = calculateDataMaturity(totalDaysWithData, consistencyRate)

  const metrics: TeamMetrics = {
    liveVibe,
    dayVibe,
    weekVibe,
    previousWeekVibe,
    momentum,
    participation: {
      today: todayEntries,
      teamSize: totalParticipants,
      rate: participationRate,
      trend: calculateTrend(todayEntries - yesterdayEntries),
    },
    dayState,
    weekState,
    maturity: {
      level: maturityLevel,
      daysOfData: totalDaysWithData,
      consistencyRate,
    },
    lastUpdated: new Date().toISOString(),
    hasEnoughData: hasMinimumData(last7Days.reduce((sum, d) => sum + d.count, 0)),
  }

  return { metrics, teamName: team.name }
}

/**
 * Get daily vibe history for charts (public version)
 */
export async function getPublicVibeHistory(directTeamId?: string): Promise<DailyVibe[]> {
  let teamId = directTeamId
  if (!teamId) {
    const context = await getTeamContext()
    if (!context) return []
    teamId = context.teamId
  }

  const supabase = await createClient()

  const { data: rawHistory } = await supabase
    .rpc('get_team_trend', { p_team_id: teamId })

  return (rawHistory || []).map((d: { date: string; average: number; count: number }) => ({
    date: d.date,
    average: d.average,
    count: d.count,
    participantCount: 0,
  }))
}

/**
 * Public wow stats - basic overview of wow activity
 */
export interface PublicWowStats {
  totalSessions: number
  closedSessions: number
  averageScore: number | null
  level: 'shu' | 'ha' | 'ri'
  activeSessions: {
    id: string
    angle: string
    sessionCode: string
  }[]
  recentSessions: {
    angle: string
    score: number | null
    responseCount: number
    closedAt: string | null
  }[]
  scoresByAngle: Record<string, number | null>
}

export async function getPublicWowStats(directTeamId?: string): Promise<PublicWowStats | null> {
  let teamId = directTeamId
  if (!teamId) {
    const context = await getTeamContext()
    if (!context) return null
    teamId = context.teamId
  }

  // Use admin client when called with directTeamId (admin flow) to bypass RLS
  const supabase = directTeamId ? await createAdminClient() : await createClient()

  // Get team wow level
  const { data: teamData } = await supabase
    .from('teams')
    .select('wow_level')
    .eq('id', teamId)
    .single()

  const level = (teamData?.wow_level as 'shu' | 'ha' | 'ri') || 'shu'

  // Get all sessions for this team
  const { data: sessions } = await supabase
    .from('delta_sessions')
    .select('id, angle, status, closed_at, session_code')
    .eq('team_id', teamId)
    .order('closed_at', { ascending: false })

  if (!sessions || sessions.length === 0) {
    return {
      totalSessions: 0,
      closedSessions: 0,
      averageScore: null,
      level,
      activeSessions: [],
      recentSessions: [],
      scoresByAngle: {},
    }
  }

  const closedSessions = sessions.filter(s => s.status === 'closed')
  const activeSessions = sessions
    .filter(s => s.status === 'active')
    .map(s => ({
      id: s.id,
      angle: s.angle,
      sessionCode: s.session_code,
    }))

  // Get scores for all closed sessions (needed for per-angle radar + recent list)
  const sessionScores: { angle: string; score: number | null; responseCount: number; closedAt: string | null }[] = []
  const angleScores: Record<string, number[]> = {}

  for (const session of closedSessions) {
    const { data: responses } = await supabase.rpc('get_delta_responses', {
      p_session_id: session.id,
    })

    const responseCount = responses?.length || 0
    let score: number | null = null

    if (responses && responses.length >= 3) {
      let totalScore = 0
      let scoreCount = 0

      for (const response of responses as { answers: Record<string, number> }[]) {
        for (const s of Object.values(response.answers)) {
          if (typeof s === 'number' && s >= 1 && s <= 5) {
            totalScore += s
            scoreCount++
          }
        }
      }

      if (scoreCount > 0) {
        score = totalScore / scoreCount
        if (!angleScores[session.angle]) angleScores[session.angle] = []
        angleScores[session.angle].push(score)
      }
    }

    sessionScores.push({
      angle: session.angle,
      score,
      responseCount,
      closedAt: session.closed_at,
    })
  }

  // Per-angle averages for radar chart
  const scoresByAngle: Record<string, number | null> = {}
  for (const [angle, scores] of Object.entries(angleScores)) {
    scoresByAngle[angle] = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
  }

  // Calculate overall average from sessions with scores (rounded to 1 decimal for consistency)
  const sessionsWithScores = sessionScores.filter(s => s.score !== null)
  const averageScore = sessionsWithScores.length > 0
    ? Math.round((sessionsWithScores.reduce((sum, s) => sum + (s.score || 0), 0) / sessionsWithScores.length) * 10) / 10
    : null

  return {
    totalSessions: sessions.length,
    closedSessions: closedSessions.length,
    averageScore,
    level,
    activeSessions,
    recentSessions: sessionScores.slice(0, 5),
    scoresByAngle,
  }
}

/**
 * Get a coach question for the team based on their current state
 */
interface CoachQuestion {
  nl: string
  en: string
}

const COACH_QUESTIONS: {
  rising: CoachQuestion[]
  declining: CoachQuestion[]
  stable: CoachQuestion[]
  noData: CoachQuestion[]
} = {
  rising: [
    { nl: 'Wat draagt bij aan de positieve energie in het team?', en: 'What is contributing to the positive energy in the team?' },
    { nl: 'Hoe kunnen we dit momentum vasthouden?', en: 'How can we maintain this momentum?' },
    { nl: 'Wat hebben we recent anders gedaan dat goed werkt?', en: 'What have we done differently recently that works well?' },
  ],
  declining: [
    { nl: 'Wat houdt ons bezig dat we nog niet besproken hebben?', en: 'What is on our minds that we haven\'t discussed yet?' },
    { nl: 'Waar lopen we tegenaan in ons dagelijks werk?', en: 'What obstacles are we facing in our daily work?' },
    { nl: 'Wat zou het team helpen om beter te functioneren?', en: 'What would help the team function better?' },
  ],
  stable: [
    { nl: 'Wat kunnen we doen om een stap verder te komen?', en: 'What can we do to take the next step?' },
    { nl: 'Waar zijn we trots op als team?', en: 'What are we proud of as a team?' },
    { nl: 'Welke kleine verbetering zou veel impact hebben?', en: 'What small improvement would have a big impact?' },
  ],
  noData: [
    { nl: 'Hoe voelt het om deel uit te maken van dit team?', en: 'How does it feel to be part of this team?' },
    { nl: 'Wat maakt ons werk betekenisvol?', en: 'What makes our work meaningful?' },
    { nl: 'Waar kijken we naar uit deze week?', en: 'What are we looking forward to this week?' },
  ],
}

export async function getCoachQuestion(language: 'nl' | 'en' = 'nl', directTeamId?: string): Promise<string> {
  const { metrics } = await getPublicTeamMetrics(directTeamId)

  let questionSet: CoachQuestion[]

  if (!metrics || !metrics.hasEnoughData) {
    questionSet = COACH_QUESTIONS.noData
  } else if (metrics.momentum.direction === 'rising') {
    questionSet = COACH_QUESTIONS.rising
  } else if (metrics.momentum.direction === 'declining') {
    questionSet = COACH_QUESTIONS.declining
  } else {
    questionSet = COACH_QUESTIONS.stable
  }

  // Pick a random question from the set
  const randomIndex = Math.floor(Math.random() * questionSet.length)
  return questionSet[randomIndex][language]
}

/**
 * Get a shareable results URL for a team (admin only)
 * Generates a new invite token and returns the results page URL with token
 */
export async function getResultsShareUrl(teamId: string): Promise<string | null> {
  const adminUser = await getAdminUser()
  if (!adminUser) return null

  const supabase = await createClient()

  // Verify team ownership
  let query = supabase.from('teams').select('slug').eq('id', teamId)
  if (adminUser.role !== 'super_admin') {
    query = query.eq('owner_id', adminUser.id)
  }
  const { data: team } = await query.single()
  if (!team) return null

  // Generate new token
  const adminSupabase = await createAdminClient()
  const token = generateToken()
  const tokenHash = hashToken(token)

  await adminSupabase.from('invite_links').update({ is_active: false }).eq('team_id', teamId)
  await adminSupabase.from('invite_links').insert({ team_id: teamId, token_hash: tokenHash })

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()
  return `${baseUrl}/results/${team.slug}?k=${token}`
}
