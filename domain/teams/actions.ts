'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAdmin, AdminUser } from '@/lib/auth/admin'
import { generateSlug } from '@/lib/utils'
import { hashToken, generateToken } from '@/lib/tenant/context'
import { revalidatePath } from 'next/cache'

export interface Team {
  id: string
  name: string
  slug: string
  description: string | null
  owner_id: string | null
  expected_team_size: number | null // Optional: for accurate participation %
  created_at: string
  updated_at: string
}

export interface TeamWithStats extends Team {
  participantCount: number        // People who have checked in at least once
  effectiveTeamSize: number       // expected_team_size or participantCount
  todayEntries: number
  activeLink?: {
    id: string
    token?: string // Only included when newly created
  }
}

export interface TeamTool {
  tool: 'vibe' | 'wow'
  enabled_at: string
  config: Record<string, unknown>
}

export interface UnifiedTeam extends Team {
  // Tools enabled
  tools_enabled: ('vibe' | 'wow')[]

  // Vibe stats (null if not enabled)
  vibe: {
    enabled: boolean
    participant_count: number
    today_entries: number
    average_score: number | null
    trend: 'up' | 'down' | 'stable' | null
    share_link: string | null
  } | null

  // Way of Work stats (null if not enabled)
  wow: {
    enabled: boolean
    total_sessions: number
    active_sessions: number
    closed_sessions: number
    average_score: number | null
    trend: 'up' | 'down' | 'stable' | null
    last_session_date: string | null
    level: 'shu' | 'ha' | 'ri'
    level_updated_at: string | null
  } | null

  // Computed
  last_updated: string
  needs_attention: boolean
}

// Helper to calculate trend by comparing two periods
function calculateTrend(currentAvg: number | null, previousAvg: number | null): 'up' | 'down' | 'stable' | null {
  if (currentAvg === null || previousAvg === null) return null
  const threshold = 0.3 // Significant change threshold
  const diff = currentAvg - previousAvg
  if (diff > threshold) return 'up'
  if (diff < -threshold) return 'down'
  return 'stable'
}

// Helper to verify team ownership
async function verifyTeamOwnership(teamId: string, adminUser: AdminUser): Promise<boolean> {
  // Super admin can access all teams
  if (adminUser.role === 'super_admin') return true

  const supabase = await createClient()
  const { data } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single()

  return data?.owner_id === adminUser.id
}

export async function getTeams(appType?: 'vibe' | 'wow'): Promise<TeamWithStats[]> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  // Build query - filter by owner unless super admin
  let query = supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })

  // Filter by owner_id - always exclude null owners, and filter by specific owner if not super admin
  query = query.not('owner_id', 'is', null)
  if (adminUser.role !== 'super_admin') {
    query = query.eq('owner_id', adminUser.id)
  }

  const { data: teams, error } = await query

  if (error) throw error

  // If appType filter is provided, filter by enabled tools
  let filteredTeams = teams || []
  if (appType) {
    const { data: toolTeams } = await supabase
      .from('team_tools')
      .select('team_id')
      .eq('tool', appType)

    const toolTeamIds = new Set(toolTeams?.map(t => t.team_id) || [])
    filteredTeams = filteredTeams.filter(team => toolTeamIds.has(team.id))
  }

  // Get stats for each team
  const teamsWithStats: TeamWithStats[] = await Promise.all(
    filteredTeams.map(async (team) => {
      const { count: participantCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', team.id)

      const { count: todayEntries } = await supabase
        .from('mood_entries')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', team.id)
        .eq('entry_date', new Date().toISOString().split('T')[0])

      const { data: activeLink } = await supabase
        .from('invite_links')
        .select('id')
        .eq('team_id', team.id)
        .eq('is_active', true)
        .single()

      const actualParticipants = participantCount || 0

      return {
        ...team,
        participantCount: actualParticipants,
        effectiveTeamSize: team.expected_team_size || actualParticipants,
        todayEntries: todayEntries || 0,
        activeLink: activeLink || undefined,
      }
    })
  )

  return teamsWithStats
}

// Helper: Check if team has denormalized stats (migration has run)
function hasDenormalizedStats(team: Record<string, unknown>): boolean {
  return team.pulse_stats_updated_at !== undefined && team.pulse_stats_updated_at !== null
}

// Helper: Compute Vibe stats the old way (fallback before migration)
async function computeVibeStatsFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  teamSlug: string,
  hasActiveLink: boolean
): Promise<NonNullable<UnifiedTeam['vibe']>> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [participantResult, todayResult, recentMoodsResult, prevMoodsResult] = await Promise.all([
    supabase.from('participants').select('*', { count: 'exact', head: true }).eq('team_id', teamId),
    supabase.from('mood_entries').select('*', { count: 'exact', head: true }).eq('team_id', teamId).eq('entry_date', new Date().toISOString().split('T')[0]),
    supabase.from('mood_entries').select('mood').eq('team_id', teamId).gte('entry_date', sevenDaysAgo),
    supabase.from('mood_entries').select('mood').eq('team_id', teamId).gte('entry_date', fourteenDaysAgo).lt('entry_date', sevenDaysAgo),
  ])

  const avgScore = recentMoodsResult.data && recentMoodsResult.data.length > 0
    ? recentMoodsResult.data.reduce((sum, m) => sum + m.mood, 0) / recentMoodsResult.data.length
    : null
  const prevAvgScore = prevMoodsResult.data && prevMoodsResult.data.length > 0
    ? prevMoodsResult.data.reduce((sum, m) => sum + m.mood, 0) / prevMoodsResult.data.length
    : null

  return {
    enabled: true,
    participant_count: participantResult.count || 0,
    today_entries: todayResult.count || 0,
    average_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
    trend: calculateTrend(avgScore, prevAvgScore),
    share_link: hasActiveLink ? teamSlug : null,
  }
}

// Helper: Compute Way of Work stats the old way (fallback before migration)
async function computeWowStatsFallback(teamId: string): Promise<NonNullable<UnifiedTeam['wow']>> {
  const adminSupabase = await createAdminClient()
  const { data: sessions } = await adminSupabase
    .from('delta_sessions')
    .select('id, status, created_at')
    .eq('team_id', teamId)

  const activeSessions = sessions?.filter(s => s.status === 'active').length || 0
  const closedSessions = sessions?.filter(s => s.status === 'closed') || []
  const sortedClosed = closedSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const calculateSessionsAvg = async (sessionIds: string[]): Promise<number | null> => {
    if (sessionIds.length === 0) return null
    const { data: responses } = await adminSupabase.from('delta_responses').select('answers').in('session_id', sessionIds)
    if (!responses || responses.length === 0) return null
    let totalScore = 0, scoreCount = 0
    for (const r of responses) {
      const answers = r.answers as Record<string, number>
      for (const score of Object.values(answers)) {
        if (typeof score === 'number' && score >= 1 && score <= 5) { totalScore += score; scoreCount++ }
      }
    }
    return scoreCount > 0 ? totalScore / scoreCount : null
  }

  const avgScore = await calculateSessionsAvg(sortedClosed.map(s => s.id))
  let deltaTrend: 'up' | 'down' | 'stable' | null = null
  if (sortedClosed.length >= 4) {
    const recentAvg = await calculateSessionsAvg(sortedClosed.slice(0, 2).map(s => s.id))
    const olderAvg = await calculateSessionsAvg(sortedClosed.slice(2, 4).map(s => s.id))
    deltaTrend = calculateTrend(recentAvg, olderAvg)
  } else if (sortedClosed.length >= 2) {
    const recentAvg = await calculateSessionsAvg([sortedClosed[0].id])
    const olderAvg = await calculateSessionsAvg([sortedClosed[sortedClosed.length - 1].id])
    deltaTrend = calculateTrend(recentAvg, olderAvg)
  }

  const lastSession = sessions?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  return {
    enabled: true,
    total_sessions: sessions?.length || 0,
    active_sessions: activeSessions,
    closed_sessions: closedSessions.length,
    average_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
    trend: deltaTrend,
    last_session_date: lastSession?.created_at || null,
    level: 'shu' as const,  // Will be fetched from team data
    level_updated_at: null,
  }
}

// Get all teams with unified stats for both tools
// Uses denormalized stats if available (fast), falls back to computed stats (slow but works without migration)
export async function getTeamsUnified(filter?: 'all' | 'vibe' | 'wow' | 'needs_attention'): Promise<UnifiedTeam[]> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  // Build query - filter by owner unless super admin
  let query = supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })

  // Always exclude orphaned teams with null owner, then filter by specific owner if not super admin
  query = query.not('owner_id', 'is', null)
  if (adminUser.role !== 'super_admin') {
    query = query.eq('owner_id', adminUser.id)
  }

  const { data: teams, error } = await query
  if (error) throw error

  const teamIds = (teams || []).map(t => t.id)
  if (teamIds.length === 0) return []

  // Batch fetch: team tools and active invite links
  const [toolsResult, linksResult] = await Promise.all([
    supabase.from('team_tools').select('*').in('team_id', teamIds),
    supabase.from('invite_links').select('team_id').in('team_id', teamIds).eq('is_active', true),
  ])

  // Build lookup maps
  const toolsByTeam = new Map<string, TeamTool[]>()
  toolsResult.data?.forEach(tool => {
    const existing = toolsByTeam.get(tool.team_id) || []
    existing.push({ tool: tool.tool, enabled_at: tool.enabled_at, config: tool.config || {} })
    toolsByTeam.set(tool.team_id, existing)
  })

  const teamsWithActiveLink = new Set(linksResult.data?.map(l => l.team_id) || [])

  // Build unified teams - use denormalized data if available, else fallback
  const unifiedTeams: UnifiedTeam[] = await Promise.all(
    (teams || []).map(async (team) => {
      const teamTools = toolsByTeam.get(team.id) || []
      const tools_enabled = teamTools.map(t => t.tool) as ('vibe' | 'wow')[]
      const hasVibe = tools_enabled.includes('vibe')
      const hasWow = tools_enabled.includes('wow')
      const useFastPath = hasDenormalizedStats(team)

      // Vibe stats - always populated (tools are always enabled)
      let vibeStats: UnifiedTeam['vibe'] = null
      if (useFastPath) {
        const avgScore = team.pulse_avg_score ? parseFloat(String(team.pulse_avg_score)) : null
        const prevAvgScore = team.pulse_prev_avg_score ? parseFloat(String(team.pulse_prev_avg_score)) : null
        vibeStats = {
          enabled: true,
          participant_count: (team.pulse_participant_count as number) || 0,
          today_entries: (team.pulse_today_entries as number) || 0,
          average_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
          trend: calculateTrend(avgScore, prevAvgScore),
          share_link: teamsWithActiveLink.has(team.id) ? team.slug : null,
        }
      } else {
        vibeStats = await computeVibeStatsFallback(supabase, team.id, team.slug, teamsWithActiveLink.has(team.id))
      }

      // Way of Work stats - always populated (tools are always enabled)
      let wowStats: UnifiedTeam['wow'] = null
      if (useFastPath) {
        const avgScore = team.delta_avg_score ? parseFloat(String(team.delta_avg_score)) : null
        const prevAvgScore = team.delta_prev_avg_score ? parseFloat(String(team.delta_prev_avg_score)) : null
        wowStats = {
          enabled: true,
          total_sessions: (team.delta_total_sessions as number) || 0,
          active_sessions: (team.delta_active_sessions as number) || 0,
          closed_sessions: (team.delta_closed_sessions as number) || 0,
          average_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
          trend: calculateTrend(avgScore, prevAvgScore),
          last_session_date: (team.delta_last_session_at as string) || null,
          level: ((team as Record<string, unknown>).wow_level as 'shu' | 'ha' | 'ri') || 'shu',
          level_updated_at: ((team as Record<string, unknown>).wow_level_updated_at as string) || null,
        }
      } else {
        wowStats = await computeWowStatsFallback(team.id)
      }

      // Compute needs_attention
      const needsAttention =
        (vibeStats && vibeStats.average_score !== null && vibeStats.average_score < 2.5) ||
        (wowStats && wowStats.average_score !== null && wowStats.average_score < 2.5) ||
        false

      // Compute last_updated
      const lastUpdated = wowStats?.last_session_date || team.updated_at

      return {
        ...team,
        tools_enabled,
        vibe: vibeStats,
        wow: wowStats,
        last_updated: lastUpdated,
        needs_attention: needsAttention,
      }
    })
  )

  // Apply filter
  if (filter === 'vibe') {
    return unifiedTeams.filter(t => t.tools_enabled.includes('vibe'))
  }
  if (filter === 'wow') {
    return unifiedTeams.filter(t => t.tools_enabled.includes('wow'))
  }
  if (filter === 'needs_attention') {
    return unifiedTeams.filter(t => t.needs_attention)
  }

  return unifiedTeams
}

export async function getTeam(id: string): Promise<TeamWithStats | null> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  const { data: team, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !team) return null

  // Verify ownership
  if (!(await verifyTeamOwnership(id, adminUser))) {
    return null
  }

  const { count: participantCount } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', team.id)

  const { count: todayEntries } = await supabase
    .from('mood_entries')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', team.id)
    .eq('entry_date', new Date().toISOString().split('T')[0])

  const { data: activeLink } = await supabase
    .from('invite_links')
    .select('id')
    .eq('team_id', team.id)
    .eq('is_active', true)
    .single()

  const actualParticipants = participantCount || 0

  return {
    ...team,
    participantCount: actualParticipants,
    effectiveTeamSize: team.expected_team_size || actualParticipants,
    todayEntries: todayEntries || 0,
    activeLink: activeLink || undefined,
  }
}

// Get a single unified team with full stats
// Uses denormalized stats if available (fast), falls back to computed stats (slow but works without migration)
export async function getTeamUnified(id: string): Promise<UnifiedTeam | null> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  // Fetch team, tools, and active link in parallel
  const [teamResult, toolsResult, linkResult] = await Promise.all([
    supabase.from('teams').select('*').eq('id', id).single(),
    supabase.from('team_tools').select('*').eq('team_id', id),
    supabase.from('invite_links').select('id').eq('team_id', id).eq('is_active', true).single(),
  ])

  const { data: team, error } = teamResult
  if (error || !team) return null

  // Verify ownership
  if (!(await verifyTeamOwnership(id, adminUser))) {
    return null
  }

  const tools_enabled = (toolsResult.data || []).map(t => t.tool) as ('vibe' | 'wow')[]
  const hasVibe = tools_enabled.includes('vibe')
  const hasWow = tools_enabled.includes('wow')
  const hasActiveLink = !!linkResult.data
  const useFastPath = hasDenormalizedStats(team)

  // Vibe stats - always populated (tools are always enabled)
  let vibeStats: UnifiedTeam['vibe'] = null
  if (useFastPath) {
    const avgScore = team.pulse_avg_score ? parseFloat(String(team.pulse_avg_score)) : null
    const prevAvgScore = team.pulse_prev_avg_score ? parseFloat(String(team.pulse_prev_avg_score)) : null
    vibeStats = {
      enabled: true,
      participant_count: (team.pulse_participant_count as number) || 0,
      today_entries: (team.pulse_today_entries as number) || 0,
      average_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
      trend: calculateTrend(avgScore, prevAvgScore),
      share_link: hasActiveLink ? team.slug : null,
    }
  } else {
    vibeStats = await computeVibeStatsFallback(supabase, team.id, team.slug, hasActiveLink)
  }

  // Way of Work stats - always populated (tools are always enabled)
  let wowStats: UnifiedTeam['wow'] = null
  if (useFastPath) {
    const avgScore = team.delta_avg_score ? parseFloat(String(team.delta_avg_score)) : null
    const prevAvgScore = team.delta_prev_avg_score ? parseFloat(String(team.delta_prev_avg_score)) : null
    wowStats = {
      enabled: true,
      total_sessions: (team.delta_total_sessions as number) || 0,
      active_sessions: (team.delta_active_sessions as number) || 0,
      closed_sessions: (team.delta_closed_sessions as number) || 0,
      average_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
      trend: calculateTrend(avgScore, prevAvgScore),
      last_session_date: (team.delta_last_session_at as string) || null,
      level: ((team as Record<string, unknown>).wow_level as 'shu' | 'ha' | 'ri') || 'shu',
      level_updated_at: ((team as Record<string, unknown>).wow_level_updated_at as string) || null,
    }
  } else {
    wowStats = await computeWowStatsFallback(team.id)
  }

  const needsAttention =
    (vibeStats && vibeStats.average_score !== null && vibeStats.average_score < 2.5) ||
    (wowStats && wowStats.average_score !== null && wowStats.average_score < 2.5) ||
    false

  const lastUpdated = wowStats?.last_session_date || team.updated_at

  return {
    ...team,
    tools_enabled,
    vibe: vibeStats,
    wow: wowStats,
    last_updated: lastUpdated,
    needs_attention: needsAttention,
  }
}

// Get tools enabled for a team
export async function getTeamTools(teamId: string): Promise<('vibe' | 'wow')[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('team_tools')
    .select('tool')
    .eq('team_id', teamId)

  return (data || []).map(t => t.tool as 'vibe' | 'wow')
}

// Enable a tool for a team
export async function enableTool(teamId: string, tool: 'vibe' | 'wow'): Promise<{ success: boolean; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  if (!(await verifyTeamOwnership(teamId, adminUser))) {
    return { success: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('team_tools')
    .upsert({ team_id: teamId, tool }, { onConflict: 'team_id,tool' })

  if (error) {
    return { success: false, error: error.message }
  }

  // For Vibe: ensure an invite link exists
  if (tool === 'vibe') {
    // Check if active invite link exists
    const { data: existingLink } = await supabase
      .from('invite_links')
      .select('id')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single()

    // Create one if it doesn't exist
    if (!existingLink) {
      const token = generateToken()
      const tokenHash = hashToken(token)

      await supabase
        .from('invite_links')
        .insert({ team_id: teamId, token_hash: tokenHash })
    }
  }

  revalidatePath('/teams')
  revalidatePath(`/teams/${teamId}`)

  return { success: true }
}

// Disable a tool for a team
export async function disableTool(teamId: string, tool: 'vibe' | 'wow'): Promise<{ success: boolean; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  if (!(await verifyTeamOwnership(teamId, adminUser))) {
    return { success: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('team_tools')
    .delete()
    .eq('team_id', teamId)
    .eq('tool', tool)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/teams')
  revalidatePath(`/teams/${teamId}`)

  return { success: true }
}

export async function createTeam(formData: FormData): Promise<{ success: boolean; teamId?: string; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const expectedTeamSizeRaw = formData.get('expected_team_size') as string | null
  const expectedTeamSize = expectedTeamSizeRaw ? parseInt(expectedTeamSizeRaw, 10) : null

  if (!name || name.trim().length < 2) {
    return { success: false, error: 'Team name is required (min 2 characters)' }
  }

  // Validate expected_team_size if provided
  if (expectedTeamSize !== null && (isNaN(expectedTeamSize) || expectedTeamSize < 1 || expectedTeamSize > 100)) {
    return { success: false, error: 'Team size must be between 1 and 100' }
  }

  const slug = generateSlug(name)

  // Check if slug exists
  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return { success: false, error: 'A team with this name already exists' }
  }

  // Create team with owner_id
  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      owner_id: adminUser.id,
      expected_team_size: expectedTeamSize,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Enable both tools by default
  await supabase
    .from('team_tools')
    .insert([
      { team_id: team.id, tool: 'vibe' },
      { team_id: team.id, tool: 'wow' },
    ])

  // Create initial invite link for Pulse
  const token = generateToken()
  const tokenHash = hashToken(token)

  await supabase
    .from('invite_links')
    .insert({ team_id: team.id, token_hash: tokenHash })

  revalidatePath('/teams')
  revalidatePath('/vibe/admin/teams')

  return { success: true, teamId: team.id }
}

export async function updateTeam(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  // Verify ownership
  if (!(await verifyTeamOwnership(id, adminUser))) {
    return { success: false, error: 'Access denied' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const expectedTeamSizeRaw = formData.get('expected_team_size') as string | null
  const expectedTeamSize = expectedTeamSizeRaw ? parseInt(expectedTeamSizeRaw, 10) : null

  if (!name || name.trim().length < 2) {
    return { success: false, error: 'Team name is required (min 2 characters)' }
  }

  // Validate expected_team_size if provided
  if (expectedTeamSize !== null && (isNaN(expectedTeamSize) || expectedTeamSize < 1 || expectedTeamSize > 100)) {
    return { success: false, error: 'Team size must be between 1 and 100' }
  }

  const { error } = await supabase
    .from('teams')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      expected_team_size: expectedTeamSize,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/teams')
  revalidatePath(`/teams/${id}`)
  revalidatePath('/vibe/admin/teams')
  revalidatePath(`/vibe/admin/teams/${id}`)

  return { success: true }
}

export async function deleteTeam(id: string): Promise<{ success: boolean; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  // Verify ownership
  if (!(await verifyTeamOwnership(id, adminUser))) {
    return { success: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/teams')
  revalidatePath('/vibe/admin/teams')

  return { success: true }
}

export async function resetTeam(id: string): Promise<{ success: boolean; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Verify ownership
  if (!(await verifyTeamOwnership(id, adminUser))) {
    return { success: false, error: 'Access denied' }
  }

  // Delete all mood entries for this team
  const { error: moodError } = await supabase
    .from('mood_entries')
    .delete()
    .eq('team_id', id)

  if (moodError) {
    return { success: false, error: moodError.message }
  }

  // Delete all participants for this team
  const { error: participantError } = await supabase
    .from('participants')
    .delete()
    .eq('team_id', id)

  if (participantError) {
    return { success: false, error: participantError.message }
  }

  revalidatePath('/teams')
  revalidatePath(`/teams/${id}`)
  revalidatePath('/vibe/admin/teams')
  revalidatePath(`/vibe/admin/teams/${id}`)

  return { success: true }
}

export async function regenerateInviteLink(teamId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  // Verify ownership
  if (!(await verifyTeamOwnership(teamId, adminUser))) {
    return { success: false, error: 'Access denied' }
  }

  // Deactivate old links
  await supabase
    .from('invite_links')
    .update({ is_active: false })
    .eq('team_id', teamId)

  // Create new link
  const token = generateToken()
  const tokenHash = hashToken(token)

  const { error } = await supabase
    .from('invite_links')
    .insert({ team_id: teamId, token_hash: tokenHash })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/teams/${teamId}`)
  revalidatePath(`/vibe/admin/teams/${teamId}`)

  return { success: true, token }
}

export async function getShareLink(teamId: string): Promise<{ url: string; token: string } | null> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Verify ownership
  if (!(await verifyTeamOwnership(teamId, adminUser))) {
    return null
  }

  // Get team slug
  const { data: team } = await supabase
    .from('teams')
    .select('slug')
    .eq('id', teamId)
    .single()

  if (!team) return null

  // Get active invite link - we need to create a new token since we don't store raw tokens
  const token = generateToken()
  const tokenHash = hashToken(token)

  // Deactivate old links and create new one
  await supabase
    .from('invite_links')
    .update({ is_active: false })
    .eq('team_id', teamId)

  await supabase
    .from('invite_links')
    .insert({ team_id: teamId, token_hash: tokenHash })

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()

  return {
    url: `${baseUrl}/vibe/t/${team.slug}?k=${token}`,
    token,
  }
}

export async function deactivateShareLink(teamId: string): Promise<{ success: boolean; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Verify ownership
  if (!(await verifyTeamOwnership(teamId, adminUser))) {
    return { success: false, error: 'Geen toegang tot dit team' }
  }

  // Deactivate all active links for this team
  const { error } = await supabase
    .from('invite_links')
    .update({ is_active: false })
    .eq('team_id', teamId)

  if (error) {
    return { success: false, error: 'Kon link niet deactiveren' }
  }

  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}

export async function getTeamMoodHistory(teamId: string, days: number = 7): Promise<{
  date: string
  average: number
  count: number
}[]> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  // Verify ownership
  if (!(await verifyTeamOwnership(teamId, adminUser))) {
    return []
  }

  const { data } = await supabase
    .rpc('get_team_trend', { p_team_id: teamId })

  return data || []
}

// Export Pulse data as CSV-ready format
export async function exportPulseData(teamId: string): Promise<{
  success: boolean
  data?: {
    date: string
    mood: number
    alias: string | null
    comment: string | null
  }[]
  error?: string
}> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  // Verify ownership
  if (!(await verifyTeamOwnership(teamId, adminUser))) {
    return { success: false, error: 'Access denied' }
  }

  // Get all mood entries for this team
  const { data: entries, error } = await supabase
    .from('mood_entries')
    .select('entry_date, mood, alias, comment')
    .eq('team_id', teamId)
    .order('entry_date', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    data: (entries || []).map(e => ({
      date: e.entry_date,
      mood: e.mood,
      alias: e.alias,
      comment: e.comment,
    })),
  }
}
