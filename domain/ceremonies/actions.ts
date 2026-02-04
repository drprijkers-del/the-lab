'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAdmin, AdminUser } from '@/lib/auth/admin'
import { revalidatePath } from 'next/cache'
import {
  CeremonySession,
  CeremonySessionWithStats,
  CeremonyAngle,
  CeremonyLevel,
  ResponseAnswers,
  SynthesisResult,
  StatementScore,
  ScoreDistribution,
} from './types'
import { getStatements, getStatementById } from './statements'

// ============================================
// SESSION MANAGEMENT (Admin)
// ============================================

/**
 * Verify the admin owns the team for a session
 */
async function verifySessionOwnership(sessionId: string, adminUser: AdminUser): Promise<boolean> {
  if (adminUser.role === 'super_admin') return true

  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('delta_sessions')
    .select('team_id, teams!inner(owner_id)')
    .eq('id', sessionId)
    .single()

  return (data as { teams: { owner_id: string } } | null)?.teams?.owner_id === adminUser.id
}

/**
 * Get all sessions for a team
 */
export async function getTeamSessions(teamId: string): Promise<CeremonySessionWithStats[]> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Verify team ownership
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single()

  if (!team) return []
  if (adminUser.role !== 'super_admin' && team.owner_id !== adminUser.id) return []

  // Get sessions with response counts
  const { data: sessions, error } = await supabase
    .from('delta_sessions')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error || !sessions) return []

  // Get response counts and scores for each session
  const sessionsWithStats: CeremonySessionWithStats[] = await Promise.all(
    sessions.map(async (session) => {
      const { count } = await supabase
        .from('delta_responses')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id)

      const responseCount = count || 0

      // Calculate overall score if we have 3+ responses
      let overallScore: number | null = null
      if (responseCount >= 3) {
        const { data: responses } = await supabase.rpc('get_delta_responses', {
          p_session_id: session.id,
        })

        if (responses && responses.length >= 3) {
          let totalScore = 0
          let scoreCount = 0

          for (const response of responses as { answers: Record<string, number> }[]) {
            for (const score of Object.values(response.answers)) {
              if (typeof score === 'number' && score >= 1 && score <= 5) {
                totalScore += score
                scoreCount++
              }
            }
          }

          if (scoreCount > 0) {
            overallScore = Math.round((totalScore / scoreCount) * 10) / 10
          }
        }
      }

      return {
        ...session,
        response_count: responseCount,
        overall_score: overallScore,
      } as CeremonySessionWithStats
    })
  )

  return sessionsWithStats
}

/**
 * Team-level statistics
 */
export interface TeamStats {
  totalSessions: number
  activeSessions: number
  closedSessions: number
  totalResponses: number
  averageScore: number | null  // Average across all closed sessions
  sessionsByAngle: Record<string, { count: number; avgScore: number | null }>
  // Trend data for coaching insights
  trend: 'up' | 'down' | 'stable' | null
  trendDrivers: string[]  // Angle names driving the trend
  recentScores: { angle: string; score: number; sessionId: string }[]  // Last 3 sessions for trend
}

/**
 * Get aggregated team statistics
 */
export async function getTeamStats(teamId: string): Promise<TeamStats> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Verify team ownership
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single()

  const emptyStats: TeamStats = {
    totalSessions: 0,
    activeSessions: 0,
    closedSessions: 0,
    totalResponses: 0,
    averageScore: null,
    sessionsByAngle: {},
    trend: null,
    trendDrivers: [],
    recentScores: [],
  }

  if (!team) {
    return emptyStats
  }

  if (adminUser.role !== 'super_admin' && team.owner_id !== adminUser.id) {
    return emptyStats
  }

  // Get all sessions for this team, ordered by creation date
  const { data: sessions } = await supabase
    .from('delta_sessions')
    .select('id, angle, status, created_at')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (!sessions || sessions.length === 0) {
    return emptyStats
  }

  const activeSessions = sessions.filter(s => s.status === 'active').length
  const closedSessions = sessions.filter(s => s.status === 'closed').length

  // Get total response count
  const sessionIds = sessions.map(s => s.id)
  const { count: totalResponses } = await supabase
    .from('delta_responses')
    .select('*', { count: 'exact', head: true })
    .in('session_id', sessionIds)

  // Calculate scores for closed sessions with 3+ responses
  const closedSessionIds = sessions.filter(s => s.status === 'closed').map(s => s.id)
  const sessionScores: { sessionId: string; angle: string; score: number }[] = []

  for (const sessionId of closedSessionIds) {
    // Get responses for this session
    const { data: responses } = await supabase.rpc('get_delta_responses', {
      p_session_id: sessionId,
    })

    if (responses && responses.length >= 3) {
      // Get session angle
      const session = sessions.find(s => s.id === sessionId)
      if (!session) continue

      // Calculate average score across all answers
      let totalScore = 0
      let scoreCount = 0

      for (const response of responses as { answers: Record<string, number> }[]) {
        for (const score of Object.values(response.answers)) {
          if (typeof score === 'number' && score >= 1 && score <= 5) {
            totalScore += score
            scoreCount++
          }
        }
      }

      if (scoreCount > 0) {
        sessionScores.push({
          sessionId,
          angle: session.angle,
          score: totalScore / scoreCount,
        })
      }
    }
  }

  // Calculate overall average score
  const averageScore = sessionScores.length > 0
    ? Math.round((sessionScores.reduce((sum, s) => sum + s.score, 0) / sessionScores.length) * 10) / 10
    : null

  // Group by angle
  const sessionsByAngle: Record<string, { count: number; avgScore: number | null }> = {}

  for (const session of sessions) {
    if (!sessionsByAngle[session.angle]) {
      sessionsByAngle[session.angle] = { count: 0, avgScore: null }
    }
    sessionsByAngle[session.angle].count++
  }

  // Add average scores per angle
  for (const angle of Object.keys(sessionsByAngle)) {
    const angleScores = sessionScores.filter(s => s.angle === angle)
    if (angleScores.length > 0) {
      sessionsByAngle[angle].avgScore =
        Math.round((angleScores.reduce((sum, s) => sum + s.score, 0) / angleScores.length) * 10) / 10
    }
  }

  // Calculate trend from recent sessions (need at least 2 closed sessions)
  // sessionScores is ordered by most recent first (from the sessions query)
  const recentScores = sessionScores.slice(0, 3).map(s => ({
    angle: s.angle,
    score: s.score,
    sessionId: s.sessionId,
  }))

  let trend: 'up' | 'down' | 'stable' | null = null
  let trendDrivers: string[] = []

  if (sessionScores.length >= 2) {
    // Compare recent vs older scores
    const recentAvg = sessionScores.slice(0, Math.ceil(sessionScores.length / 2))
      .reduce((sum, s) => sum + s.score, 0) / Math.ceil(sessionScores.length / 2)
    const olderAvg = sessionScores.slice(Math.ceil(sessionScores.length / 2))
      .reduce((sum, s) => sum + s.score, 0) / Math.floor(sessionScores.length / 2)

    const diff = recentAvg - olderAvg

    if (diff > 0.3) {
      trend = 'up'
    } else if (diff < -0.3) {
      trend = 'down'
    } else {
      trend = 'stable'
    }

    // Find drivers: angles with biggest deviation from average
    const angleDeviations = Object.entries(sessionsByAngle)
      .filter(([_, data]) => data.avgScore !== null)
      .map(([angle, data]) => ({
        angle,
        deviation: (data.avgScore! - (averageScore || 3)),
      }))
      .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))

    // Take top 2 drivers (angles that pull the trend)
    trendDrivers = angleDeviations
      .slice(0, 2)
      .filter(d => Math.abs(d.deviation) > 0.2)
      .map(d => d.angle)
  }

  return {
    totalSessions: sessions.length,
    activeSessions,
    closedSessions,
    totalResponses: totalResponses || 0,
    averageScore,
    sessionsByAngle,
    trend,
    trendDrivers,
    recentScores,
  }
}

/**
 * Get a single session by ID
 */
export async function getSession(sessionId: string): Promise<CeremonySessionWithStats | null> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  const { data: session, error } = await supabase
    .from('delta_sessions')
    .select('*, teams(name)')
    .eq('id', sessionId)
    .single()

  if (error || !session) return null

  // Verify ownership
  if (!(await verifySessionOwnership(sessionId, adminUser))) {
    return null
  }

  // Get response count
  const { count } = await supabase
    .from('delta_responses')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  return {
    ...session,
    response_count: count || 0,
    team_name: (session as { teams?: { name: string } }).teams?.name,
  } as CeremonySessionWithStats
}

/**
 * Create a new Delta session
 */
export async function createSession(
  teamId: string,
  angle: CeremonyAngle,
  title?: string
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Verify team ownership and get ceremony level
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id, ceremony_level')
    .eq('id', teamId)
    .single()

  if (!team) {
    return { success: false, error: 'Team not found' }
  }

  if (adminUser.role !== 'super_admin' && team.owner_id !== adminUser.id) {
    return { success: false, error: 'Access denied' }
  }

  // Generate session code
  const { data: sessionCode } = await supabase.rpc('generate_session_code')

  if (!sessionCode) {
    return { success: false, error: 'Failed to generate session code' }
  }

  // Get team's current ceremony level (default to 'shu')
  const sessionLevel = (team.ceremony_level as CeremonyLevel) || 'shu'

  // Create session with the team's current level
  const { data: session, error } = await supabase
    .from('delta_sessions')
    .insert({
      team_id: teamId,
      session_code: sessionCode,
      angle,
      level: sessionLevel,  // Store the level this session was run at
      title: title || null,
      status: 'active',  // Start active immediately
      created_by: adminUser.id,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/teams/${teamId}`)

  return { success: true, sessionId: session.id }
}

/**
 * Close a session with outcome
 */
export async function closeSession(
  sessionId: string,
  focusArea: string,
  experiment: string,
  experimentOwner: string,
  followupDate: string
): Promise<{ success: boolean; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Verify ownership
  if (!(await verifySessionOwnership(sessionId, adminUser))) {
    return { success: false, error: 'Access denied' }
  }

  // Get session info (need team_id for level evaluation)
  const { data: session } = await supabase
    .from('delta_sessions')
    .select('team_id')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return { success: false, error: 'Session not found' }
  }

  // Calculate overall_score and participation_rate for level evaluation
  let overallScore: number | null = null
  let participationRate: number | null = null

  const { count: responseCount } = await supabase
    .from('delta_responses')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const numResponses = responseCount || 0

  // Calculate overall score if we have responses
  if (numResponses >= 3) {
    const { data: responses } = await supabase.rpc('get_delta_responses', {
      p_session_id: sessionId,
    })

    if (responses && responses.length >= 3) {
      let totalScore = 0
      let scoreCount = 0
      for (const response of responses as { answers: Record<string, number> }[]) {
        for (const score of Object.values(response.answers)) {
          if (typeof score === 'number' && score >= 1 && score <= 5) {
            totalScore += score
            scoreCount++
          }
        }
      }
      if (scoreCount > 0) {
        overallScore = Math.round((totalScore / scoreCount) * 100) / 100
      }
    }
  }

  // Calculate participation rate (responses / expected team size)
  const { data: team } = await supabase
    .from('teams')
    .select('expected_team_size')
    .eq('id', session.team_id)
    .single()

  if (team?.expected_team_size && team.expected_team_size > 0) {
    participationRate = Math.min(numResponses / team.expected_team_size, 1.0)
    participationRate = Math.round(participationRate * 100) / 100
  }

  // Update session with computed fields for level evaluation
  const { error } = await supabase
    .from('delta_sessions')
    .update({
      status: 'closed',
      focus_area: focusArea,
      experiment,
      experiment_owner: experimentOwner,
      followup_date: followupDate,
      closed_at: new Date().toISOString(),
      overall_score: overallScore,
      participation_rate: participationRate,
      follow_up_recorded: !!followupDate,
    })
    .eq('id', sessionId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Evaluate ceremony level (may upgrade Shu->Ha->Ri)
  await supabase.rpc('evaluate_ceremony_level', { p_team_id: session.team_id })

  revalidatePath(`/delta/session/${sessionId}`)
  revalidatePath(`/teams/${session.team_id}`)

  return { success: true }
}

/**
 * Delete a session (admin only)
 */
export async function deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Get session to find team_id for revalidation
  const { data: session } = await supabase
    .from('delta_sessions')
    .select('team_id')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return { success: false, error: 'Session not found' }
  }

  // Verify ownership
  if (!(await verifySessionOwnership(sessionId, adminUser))) {
    return { success: false, error: 'Access denied' }
  }

  // Delete session (responses cascade)
  const { error } = await supabase
    .from('delta_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/teams/${session.team_id}`)

  return { success: true }
}

// ============================================
// PUBLIC PARTICIPATION
// ============================================

/**
 * Validate a session code and return session info (public)
 */
export async function validateSessionCode(sessionCode: string): Promise<{
  valid: boolean
  session?: {
    id: string
    team_name: string
    angle: CeremonyAngle
    title: string | null
    ceremony_level: CeremonyLevel
  }
}> {
  const supabase = await createClient()

  const { data } = await supabase.rpc('validate_delta_session', {
    p_session_code: sessionCode,
  })

  if (!data || data.length === 0) {
    return { valid: false }
  }

  const row = data[0]

  // Get ceremony level from session (stored when session was created)
  const { data: sessionData } = await supabase
    .from('delta_sessions')
    .select('level')
    .eq('id', row.session_id)
    .single()

  const ceremonyLevel: CeremonyLevel = (sessionData?.level as CeremonyLevel) || 'shu'

  return {
    valid: true,
    session: {
      id: row.session_id,
      team_name: row.team_name,
      angle: row.angle as CeremonyAngle,
      title: row.title,
      ceremony_level: ceremonyLevel,
    },
  }
}

/**
 * Get a team's ceremony level
 */
export async function getTeamCeremonyLevel(teamId: string): Promise<CeremonyLevel> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('teams')
    .select('ceremony_level')
    .eq('id', teamId)
    .single()

  return (data?.ceremony_level as CeremonyLevel) || 'shu'
}

/**
 * Submit a response (public)
 */
export async function submitResponse(
  sessionId: string,
  deviceId: string,
  answers: ResponseAnswers
): Promise<{ success: boolean; error?: string; alreadyResponded?: boolean }> {
  const supabase = await createClient()

  const { data } = await supabase.rpc('submit_delta_response', {
    p_session_id: sessionId,
    p_device_id: deviceId,
    p_answers: answers,
  })

  if (!data) {
    return { success: false, error: 'Failed to submit response' }
  }

  if (!data.success) {
    return {
      success: false,
      error: data.error,
      alreadyResponded: data.already_responded,
    }
  }

  return { success: true }
}

/**
 * Check if device has already responded (public)
 */
export async function hasResponded(sessionId: string, deviceId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('delta_responses')
    .select('id')
    .eq('session_id', sessionId)
    .eq('device_id', deviceId)
    .single()

  return !!data
}

/**
 * Get session outcome for team members (public, only for closed sessions)
 */
export interface PublicSessionOutcome {
  status: 'active' | 'closed'
  closed: boolean
  focus_area: string | null
  experiment: string | null
  overall_score: number | null
  response_count: number
}

export async function getPublicSessionOutcome(sessionId: string): Promise<PublicSessionOutcome | null> {
  const supabase = await createClient()

  // Get session info (public read access for outcome)
  const { data: session } = await supabase
    .from('delta_sessions')
    .select('status, focus_area, experiment, angle')
    .eq('id', sessionId)
    .single()

  if (!session) return null

  // Get response count
  const { count } = await supabase
    .from('delta_responses')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const responseCount = count || 0

  // Calculate overall score if we have 3+ responses
  let overallScore: number | null = null
  if (responseCount >= 3) {
    const { data: responses } = await supabase.rpc('get_delta_responses', {
      p_session_id: sessionId,
    })

    if (responses && responses.length >= 3) {
      let totalScore = 0
      let scoreCount = 0

      for (const response of responses as { answers: Record<string, number> }[]) {
        for (const score of Object.values(response.answers)) {
          if (typeof score === 'number' && score >= 1 && score <= 5) {
            totalScore += score
            scoreCount++
          }
        }
      }

      if (scoreCount > 0) {
        overallScore = Math.round((totalScore / scoreCount) * 10) / 10
      }
    }
  }

  return {
    status: session.status,
    closed: session.status === 'closed',
    focus_area: session.focus_area,
    experiment: session.experiment,
    overall_score: overallScore,
    response_count: responseCount,
  }
}

// ============================================
// SYNTHESIS
// ============================================

/**
 * Get synthesis for a session (admin only)
 */
export async function synthesizeSession(sessionId: string): Promise<SynthesisResult | null> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Verify ownership
  if (!(await verifySessionOwnership(sessionId, adminUser))) {
    return null
  }

  // Get session to know the angle and level
  const { data: session } = await supabase
    .from('delta_sessions')
    .select('angle, level')
    .eq('id', sessionId)
    .single()

  if (!session) return null

  // Get all responses
  const { data: responses } = await supabase.rpc('get_delta_responses', {
    p_session_id: sessionId,
  })

  if (!responses || responses.length === 0) {
    return null
  }

  // Get statements for this angle and level
  const sessionLevel = (session.level as CeremonyLevel) || 'shu'
  const statements = getStatements(session.angle as CeremonyAngle, sessionLevel)

  // Track all scores for overall calculation
  let allScoresSum = 0
  let allScoresCount = 0

  // Calculate score, distribution, and variance per statement
  const scores: StatementScore[] = statements.map(statement => {
    const statementScores = (responses as { answers: ResponseAnswers }[])
      .map(r => r.answers[statement.id])
      .filter((score): score is number => score !== undefined && score !== null)

    // Calculate distribution [1s, 2s, 3s, 4s, 5s]
    const distribution: ScoreDistribution = [0, 0, 0, 0, 0]
    statementScores.forEach(score => {
      if (score >= 1 && score <= 5) {
        distribution[score - 1]++
      }
    })

    // Calculate average
    const avgScore = statementScores.length > 0
      ? statementScores.reduce((a, b) => a + b, 0) / statementScores.length
      : 0

    // Calculate variance (standard deviation)
    const variance = statementScores.length > 1
      ? Math.sqrt(
          statementScores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) /
          statementScores.length
        )
      : 0

    // Add to overall totals
    allScoresSum += statementScores.reduce((a, b) => a + b, 0)
    allScoresCount += statementScores.length

    return {
      statement,
      score: Math.round(avgScore * 100) / 100,
      response_count: statementScores.length,
      distribution,
      variance: Math.round(variance * 100) / 100,
    }
  })

  // Calculate overall session score
  const overallScore = allScoresCount > 0
    ? Math.round((allScoresSum / allScoresCount) * 100) / 100
    : 0

  // Count statements with high disagreement (variance > 1.0)
  const disagreementCount = scores.filter(s => s.variance > 1.0).length

  // Sort by score (high to low)
  const sorted = [...scores].sort((a, b) => b.score - a.score)

  // Top 2 = strengths, Bottom 2 = tensions
  const strengths = sorted.slice(0, 2)
  const tensions = sorted.slice(-2).reverse()

  // Derive focus area from lowest tension
  const lowestTension = tensions[0]
  const focusArea = deriveFocusArea(lowestTension)

  // Generate experiment suggestion
  const suggestedExperiment = generateExperiment(lowestTension)

  return {
    strengths,
    tensions,
    all_scores: sorted,
    overall_score: overallScore,
    disagreement_count: disagreementCount,
    focus_area: focusArea,
    suggested_experiment: suggestedExperiment,
    response_count: responses.length,
  }
}

/**
 * Derive focus area from the lowest scoring statement
 */
function deriveFocusArea(tension: StatementScore): string {
  // Map statement patterns to focus areas
  const focusAreas: Record<string, string> = {
    // Scrum
    'scrum_1': 'Sprint Goal achievement',
    'scrum_2': 'Daily Scrum efficiency',
    'scrum_3': 'Product Owner availability',
    'scrum_4': 'Sprint scope stability',
    'scrum_5': 'Retrospective outcomes',
    'scrum_6': 'Retro action follow-through',
    'scrum_7': 'Sprint Goal clarity',
    'scrum_8': 'Stakeholder boundaries',
    'scrum_9': 'Team autonomy',
    'scrum_10': 'Scope negotiation',

    // Flow
    'flow_1': 'Work in Progress limits',
    'flow_2': 'Cycle time',
    'flow_3': 'Code review speed',
    'flow_4': 'Work clarity',
    'flow_5': 'Blocker resolution',
    'flow_6': 'WIP discipline',
    'flow_7': 'Deployment frequency',
    'flow_8': 'Wait time reduction',
    'flow_9': 'Board accuracy',
    'flow_10': 'Focus time protection',

    // Ownership
    'own_1': 'Deployment autonomy',
    'own_2': 'Proactive bug fixing',
    'own_3': 'Technical decision authority',
    'own_4': 'On-call awareness',
    'own_5': 'Production access',
    'own_6': 'Incident learning',
    'own_7': 'Service creation freedom',
    'own_8': 'Backlog ownership',
    'own_9': 'Cross-ownership refactoring',
    'own_10': 'Blameless culture',

    // Collaboration
    'collab_1': 'Pair programming',
    'collab_2': 'Feedback frequency',
    'collab_3': 'Help-seeking behavior',
    'collab_4': 'Knowledge sharing',
    'collab_5': 'Documentation',
    'collab_6': 'Onboarding speed',
    'collab_7': 'Conflict resolution',
    'collab_8': 'Meeting participation',
    'collab_9': 'Work visibility',
    'collab_10': 'Team celebration',

    // Technical Excellence
    'tech_1': 'Test coverage',
    'tech_2': 'Test suite speed',
    'tech_3': 'Proactive refactoring',
    'tech_4': 'Tech debt management',
    'tech_5': 'Coding standards',
    'tech_6': 'Local development setup',
    'tech_7': 'Deployment confidence',
    'tech_8': 'Rollback capability',
    'tech_9': 'Documentation maintenance',
    'tech_10': 'Architecture decisions',
  }

  return focusAreas[tension.statement.id] || 'Team process improvement'
}

/**
 * Generate experiment suggestion based on the tension
 */
function generateExperiment(tension: StatementScore): string {
  // Map statement IDs to specific experiments
  const experiments: Record<string, string> = {
    // Scrum
    'scrum_1': 'For the next Sprint, define the Sprint Goal before selecting any items. Check in on it daily.',
    'scrum_2': 'Use a timer. Everyone gets 1 minute. If Daily runs over, discuss why in the Retro.',
    'scrum_3': 'Block 2 hours daily where PO is available for questions. No meetings in this window.',
    'scrum_4': 'If scope is added after Planning, something of equal size must be removed immediately.',
    'scrum_5': 'At the end of each Retro, the team votes on exactly ONE action. No more.',
    'scrum_6': 'Track the action on the board. Review it in the next Retro. If not done, it becomes the only action.',
    'scrum_7': 'Start each Daily with: "How does today\'s work contribute to the Sprint Goal?"',
    'scrum_8': 'Create a "stakeholder request" column. Only move items from it during Sprint Planning.',
    'scrum_9': 'PO decides WHAT, team decides HOW. If PO specifies implementation, pause and discuss.',
    'scrum_10': 'Practice saying: "We can do that, but what should we drop?" Default answer is no.',

    // Flow
    'flow_1': 'Strict WIP limit of 1 per person for 2 weeks. No exceptions.',
    'flow_2': 'If an item is In Progress for 3+ days, it becomes the team\'s top priority.',
    'flow_3': 'All PRs reviewed within 4 hours during work hours. Make it visible when violated.',
    'flow_4': 'Each morning, everyone writes their one focus item on a physical card. No switching.',
    'flow_5': 'Blocked items move to a "Blocked" column and trigger immediate team discussion.',
    'flow_6': 'When WIP limit is hit, help others finish before starting new work. No exceptions.',
    'flow_7': 'Deploy something every day for 2 weeks. Even if it\'s tiny.',
    'flow_8': 'Track wait times visually. Discuss any wait over 2 hours in the Daily.',
    'flow_9': 'Update the board before each Daily. If not current, that\'s the first discussion topic.',
    'flow_10': 'Block 2-hour "no meeting" slots each morning. Enforce ruthlessly.',

    // Ownership
    'own_1': 'Remove approval gates. Anyone can deploy. Track who deploys and celebrate it.',
    'own_2': 'Reserve 10% of Sprint for unplanned bug fixing. First person to notice fixes it.',
    'own_3': 'Next technical decision: team discusses and decides. Architect advises only.',
    'own_4': 'Create a one-pager: who\'s on-call, how to reach them, what to do first.',
    'own_5': 'Give everyone read access to production logs. No approval needed.',
    'own_6': 'Schedule a 30-min incident review after every outage. Blameless format.',
    'own_7': 'Create a self-service template for new services. Anyone can use it.',
    'own_8': 'Team reviews and re-prioritizes the backlog together once per Sprint.',
    'own_9': 'Rotate "refactoring duty" each Sprint. That person owns cleanup of shared code.',
    'own_10': 'After every incident, ask "What broke?" not "Who broke it?"',

    // Collaboration
    'collab_1': 'Pair on at least one task per Sprint. Rotate pairs.',
    'collab_2': 'End each PR review with one specific piece of positive feedback.',
    'collab_3': 'Create a "stuck? ask here" Slack channel. Celebrate quick responses.',
    'collab_4': 'Reserve 30 min weekly for cross-sharing: someone teaches something they learned.',
    'collab_5': 'When you learn something not documented, document it before moving on.',
    'collab_6': 'Buddy system: new members paired with experienced ones for first 2 weeks.',
    'collab_7': 'If a disagreement lasts 5+ minutes, escalate to team vote immediately.',
    'collab_8': 'Use a round-robin format: everyone speaks before anyone speaks twice.',
    'collab_9': 'Start Daily with a quick board walk. Everyone points to their item.',
    'collab_10': 'End each Sprint with a 10-min celebration. Name specific wins.',

    // Technical Excellence
    'tech_1': 'No PR merges without tests for changed code. Enforce in CI.',
    'tech_2': 'If tests take over 10 min, fixing that becomes top priority next Sprint.',
    'tech_3': 'Everyone refactors one thing per week. Add it to your PR description.',
    'tech_4': 'Create a tech debt backlog. Reserve 10% of Sprint capacity for it.',
    'tech_5': 'Write down 3 coding standards. Enforce them in code review.',
    'tech_6': 'New team member test: can they run locally in 30 min? If not, fix the setup.',
    'tech_7': 'Deploy to production daily for 1 week. Even empty commits. Build confidence.',
    'tech_8': 'Practice a rollback. Time it. Post the result. Make it faster.',
    'tech_9': 'Every code change to a feature = update to its docs. Same PR.',
    'tech_10': 'Monthly 1-hour architecture review. Everyone invited. Decisions documented.',
  }

  return experiments[tension.statement.id] || 'Define a specific 2-week experiment targeting this area.'
}

/**
 * Get session share link
 */
export async function getSessionShareLink(sessionId: string): Promise<string | null> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Verify ownership
  if (!(await verifySessionOwnership(sessionId, adminUser))) {
    return null
  }

  const { data: session } = await supabase
    .from('delta_sessions')
    .select('session_code')
    .eq('id', sessionId)
    .single()

  if (!session) return null

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()
  return `${baseUrl}/d/${session.session_code}`
}

// ============================================
// SESSION COMPARISON
// ============================================

export interface SessionComparison {
  session1: {
    id: string
    angle: string
    date: string
    overall_score: number
    response_count: number
  }
  session2: {
    id: string
    angle: string
    date: string
    overall_score: number
    response_count: number
  }
  statements: {
    id: string
    text: string
    score1: number
    score2: number
    change: number // score2 - score1
    status: 'improved' | 'declined' | 'unchanged'
  }[]
  summary: {
    improved_count: number
    declined_count: number
    unchanged_count: number
    overall_change: number
  }
}

/**
 * Compare two Delta sessions (must be same angle)
 */
export async function compareSessions(
  sessionId1: string,
  sessionId2: string
): Promise<{ success: boolean; data?: SessionComparison; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Verify ownership of both sessions
  if (!(await verifySessionOwnership(sessionId1, adminUser))) {
    return { success: false, error: 'Access denied to session 1' }
  }
  if (!(await verifySessionOwnership(sessionId2, adminUser))) {
    return { success: false, error: 'Access denied to session 2' }
  }

  // Get both sessions
  const { data: sessions } = await supabase
    .from('delta_sessions')
    .select('*')
    .in('id', [sessionId1, sessionId2])

  if (!sessions || sessions.length !== 2) {
    return { success: false, error: 'Sessions not found' }
  }

  const s1 = sessions.find(s => s.id === sessionId1)!
  const s2 = sessions.find(s => s.id === sessionId2)!

  // Must be same angle to compare meaningfully
  if (s1.angle !== s2.angle) {
    return { success: false, error: 'Can only compare sessions with the same angle' }
  }

  // Get synthesis for both sessions
  const synth1 = await synthesizeSession(sessionId1)
  const synth2 = await synthesizeSession(sessionId2)

  if (!synth1 || !synth2) {
    return { success: false, error: 'Need at least 3 responses in each session to compare' }
  }

  // Build statement comparison
  const statementComparisons: SessionComparison['statements'] = []
  const THRESHOLD = 0.3 // Change threshold for improved/declined

  for (const score1 of synth1.all_scores) {
    const score2 = synth2.all_scores.find(s => s.statement.id === score1.statement.id)
    if (!score2) continue

    const change = score2.score - score1.score
    let status: 'improved' | 'declined' | 'unchanged' = 'unchanged'
    if (change > THRESHOLD) status = 'improved'
    else if (change < -THRESHOLD) status = 'declined'

    statementComparisons.push({
      id: score1.statement.id,
      text: score1.statement.text,
      score1: Math.round(score1.score * 10) / 10,
      score2: Math.round(score2.score * 10) / 10,
      change: Math.round(change * 10) / 10,
      status,
    })
  }

  // Sort by change (biggest improvements first)
  statementComparisons.sort((a, b) => b.change - a.change)

  const improved_count = statementComparisons.filter(s => s.status === 'improved').length
  const declined_count = statementComparisons.filter(s => s.status === 'declined').length
  const unchanged_count = statementComparisons.filter(s => s.status === 'unchanged').length
  const overall_change = Math.round((synth2.overall_score - synth1.overall_score) * 10) / 10

  return {
    success: true,
    data: {
      session1: {
        id: s1.id,
        angle: s1.angle,
        date: s1.created_at,
        overall_score: Math.round(synth1.overall_score * 10) / 10,
        response_count: synth1.response_count,
      },
      session2: {
        id: s2.id,
        angle: s2.angle,
        date: s2.created_at,
        overall_score: Math.round(synth2.overall_score * 10) / 10,
        response_count: synth2.response_count,
      },
      statements: statementComparisons,
      summary: {
        improved_count,
        declined_count,
        unchanged_count,
        overall_change,
      },
    },
  }
}

/**
 * Get sessions available for comparison (same angle, both closed with 3+ responses)
 */
export async function getComparableSessions(teamId: string): Promise<{
  angle: string
  sessions: { id: string; date: string; score: number }[]
}[]> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Verify team ownership
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single()

  if (!team) return []
  if (adminUser.role !== 'super_admin' && team.owner_id !== adminUser.id) return []

  // Get closed sessions
  const { data: sessions } = await supabase
    .from('delta_sessions')
    .select('id, angle, created_at, status')
    .eq('team_id', teamId)
    .eq('status', 'closed')
    .order('created_at', { ascending: false })

  if (!sessions || sessions.length === 0) return []

  // Group by angle and get scores
  const byAngle: Record<string, { id: string; date: string; score: number }[]> = {}

  for (const session of sessions) {
    // Get response count
    const { count } = await supabase
      .from('delta_responses')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id)

    if ((count || 0) < 3) continue

    // Get synthesis for score
    const synth = await synthesizeSession(session.id)
    if (!synth) continue

    if (!byAngle[session.angle]) {
      byAngle[session.angle] = []
    }
    byAngle[session.angle].push({
      id: session.id,
      date: session.created_at,
      score: Math.round(synth.overall_score * 10) / 10,
    })
  }

  // Only return angles with 2+ sessions
  return Object.entries(byAngle)
    .filter(([, sessions]) => sessions.length >= 2)
    .map(([angle, sessions]) => ({ angle, sessions }))
}
