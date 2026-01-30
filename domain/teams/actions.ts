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
  tool: 'pulse' | 'delta'
  enabled_at: string
  config: Record<string, unknown>
}

export interface UnifiedTeam extends Team {
  // Tools enabled
  tools_enabled: ('pulse' | 'delta')[]

  // Pulse stats (null if not enabled)
  pulse: {
    enabled: boolean
    participant_count: number
    today_entries: number
    average_score: number | null
    trend: 'up' | 'down' | 'stable' | null
    share_link: string | null
  } | null

  // Delta stats (null if not enabled)
  delta: {
    enabled: boolean
    total_sessions: number
    active_sessions: number
    closed_sessions: number
    average_score: number | null
    last_session_date: string | null
  } | null

  // Computed
  last_updated: string
  needs_attention: boolean
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

export async function getTeams(appType?: 'pulse' | 'delta'): Promise<TeamWithStats[]> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  // Build query - filter by owner unless super admin
  let query = supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })

  // If not super_admin, filter by owner_id
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

// Get all teams with unified stats for both tools
export async function getTeamsUnified(filter?: 'all' | 'pulse' | 'delta' | 'needs_attention'): Promise<UnifiedTeam[]> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  // Build query - filter by owner unless super admin
  let query = supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })

  if (adminUser.role !== 'super_admin') {
    query = query.eq('owner_id', adminUser.id)
  }

  const { data: teams, error } = await query
  if (error) throw error

  // Get all team tools in one query
  const teamIds = (teams || []).map(t => t.id)
  const { data: allTools } = await supabase
    .from('team_tools')
    .select('*')
    .in('team_id', teamIds)

  const toolsByTeam = new Map<string, TeamTool[]>()
  allTools?.forEach(tool => {
    const existing = toolsByTeam.get(tool.team_id) || []
    existing.push({ tool: tool.tool, enabled_at: tool.enabled_at, config: tool.config || {} })
    toolsByTeam.set(tool.team_id, existing)
  })

  // Build unified teams
  const unifiedTeams: UnifiedTeam[] = await Promise.all(
    (teams || []).map(async (team) => {
      const teamTools = toolsByTeam.get(team.id) || []
      const tools_enabled = teamTools.map(t => t.tool) as ('pulse' | 'delta')[]
      const hasPulse = tools_enabled.includes('pulse')
      const hasDelta = tools_enabled.includes('delta')

      // Pulse stats
      let pulseStats = null
      if (hasPulse) {
        const { count: participantCount } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)

        const { count: todayEntries } = await supabase
          .from('mood_entries')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)
          .eq('entry_date', new Date().toISOString().split('T')[0])

        // Get 7-day average
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const { data: recentMoods } = await supabase
          .from('mood_entries')
          .select('mood')
          .eq('team_id', team.id)
          .gte('entry_date', sevenDaysAgo.toISOString().split('T')[0])

        const avgScore = recentMoods && recentMoods.length > 0
          ? recentMoods.reduce((sum, m) => sum + m.mood, 0) / recentMoods.length
          : null

        // Get active link
        const { data: activeLink } = await supabase
          .from('invite_links')
          .select('id')
          .eq('team_id', team.id)
          .eq('is_active', true)
          .single()

        pulseStats = {
          enabled: true,
          participant_count: participantCount || 0,
          today_entries: todayEntries || 0,
          average_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
          trend: null as 'up' | 'down' | 'stable' | null, // TODO: compute trend
          share_link: activeLink ? team.slug : null,
        }
      }

      // Delta stats
      let deltaStats = null
      if (hasDelta) {
        const { data: sessions } = await supabase
          .from('delta_sessions')
          .select('id, status, overall_score, created_at')
          .eq('team_id', team.id)

        const activeSessions = sessions?.filter(s => s.status === 'active').length || 0
        const closedSessions = sessions?.filter(s => s.status === 'closed') || []
        const avgScore = closedSessions.length > 0
          ? closedSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / closedSessions.length
          : null

        const lastSession = sessions?.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

        deltaStats = {
          enabled: true,
          total_sessions: sessions?.length || 0,
          active_sessions: activeSessions,
          closed_sessions: closedSessions.length,
          average_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
          last_session_date: lastSession?.created_at || null,
        }
      }

      // Compute needs_attention
      const needsAttention =
        (pulseStats && pulseStats.average_score !== null && pulseStats.average_score < 2.5) ||
        (deltaStats && deltaStats.average_score !== null && deltaStats.average_score < 2.5) ||
        false

      // Compute last_updated
      const lastUpdated = deltaStats?.last_session_date || team.updated_at

      return {
        ...team,
        tools_enabled,
        pulse: pulseStats,
        delta: deltaStats,
        last_updated: lastUpdated,
        needs_attention: needsAttention,
      }
    })
  )

  // Apply filter
  if (filter === 'pulse') {
    return unifiedTeams.filter(t => t.tools_enabled.includes('pulse'))
  }
  if (filter === 'delta') {
    return unifiedTeams.filter(t => t.tools_enabled.includes('delta'))
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
export async function getTeamUnified(id: string): Promise<UnifiedTeam | null> {
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

  // Get team tools
  const { data: tools } = await supabase
    .from('team_tools')
    .select('*')
    .eq('team_id', id)

  const tools_enabled = (tools || []).map(t => t.tool) as ('pulse' | 'delta')[]
  const hasPulse = tools_enabled.includes('pulse')
  const hasDelta = tools_enabled.includes('delta')

  // Pulse stats
  let pulseStats = null
  if (hasPulse) {
    const { count: participantCount } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id)

    const { count: todayEntries } = await supabase
      .from('mood_entries')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id)
      .eq('entry_date', new Date().toISOString().split('T')[0])

    // Get 7-day average
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data: recentMoods } = await supabase
      .from('mood_entries')
      .select('mood')
      .eq('team_id', team.id)
      .gte('entry_date', sevenDaysAgo.toISOString().split('T')[0])

    const avgScore = recentMoods && recentMoods.length > 0
      ? recentMoods.reduce((sum, m) => sum + m.mood, 0) / recentMoods.length
      : null

    const { data: activeLink } = await supabase
      .from('invite_links')
      .select('id')
      .eq('team_id', team.id)
      .eq('is_active', true)
      .single()

    pulseStats = {
      enabled: true,
      participant_count: participantCount || 0,
      today_entries: todayEntries || 0,
      average_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
      trend: null as 'up' | 'down' | 'stable' | null,
      share_link: activeLink ? team.slug : null,
    }
  }

  // Delta stats
  let deltaStats = null
  if (hasDelta) {
    const { data: sessions } = await supabase
      .from('delta_sessions')
      .select('id, status, overall_score, created_at')
      .eq('team_id', team.id)

    const activeSessions = sessions?.filter(s => s.status === 'active').length || 0
    const closedSessions = sessions?.filter(s => s.status === 'closed') || []
    const avgScore = closedSessions.length > 0
      ? closedSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / closedSessions.length
      : null

    const lastSession = sessions?.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]

    deltaStats = {
      enabled: true,
      total_sessions: sessions?.length || 0,
      active_sessions: activeSessions,
      closed_sessions: closedSessions.length,
      average_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
      last_session_date: lastSession?.created_at || null,
    }
  }

  const needsAttention =
    (pulseStats && pulseStats.average_score !== null && pulseStats.average_score < 2.5) ||
    (deltaStats && deltaStats.average_score !== null && deltaStats.average_score < 2.5) ||
    false

  const lastUpdated = deltaStats?.last_session_date || team.updated_at

  return {
    ...team,
    tools_enabled,
    pulse: pulseStats,
    delta: deltaStats,
    last_updated: lastUpdated,
    needs_attention: needsAttention,
  }
}

// Get tools enabled for a team
export async function getTeamTools(teamId: string): Promise<('pulse' | 'delta')[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('team_tools')
    .select('tool')
    .eq('team_id', teamId)

  return (data || []).map(t => t.tool as 'pulse' | 'delta')
}

// Enable a tool for a team
export async function enableTool(teamId: string, tool: 'pulse' | 'delta'): Promise<{ success: boolean; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

  if (!(await verifyTeamOwnership(teamId, adminUser))) {
    return { success: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('team_tools')
    .upsert({ team_id: teamId, tool }, { onConflict: 'team_id,tool' })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/teams')
  revalidatePath(`/teams/${teamId}`)

  return { success: true }
}

// Disable a tool for a team
export async function disableTool(teamId: string, tool: 'pulse' | 'delta'): Promise<{ success: boolean; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createClient()

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
      { team_id: team.id, tool: 'pulse' },
      { team_id: team.id, tool: 'delta' },
    ])

  // Create initial invite link for Pulse
  const token = generateToken()
  const tokenHash = hashToken(token)

  await supabase
    .from('invite_links')
    .insert({ team_id: team.id, token_hash: tokenHash })

  revalidatePath('/teams')
  revalidatePath('/pulse/admin/teams')
  revalidatePath('/delta/teams')

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
  revalidatePath('/pulse/admin/teams')
  revalidatePath(`/pulse/admin/teams/${id}`)
  revalidatePath('/delta/teams')
  revalidatePath(`/delta/teams/${id}`)

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
  revalidatePath('/pulse/admin/teams')
  revalidatePath('/delta/teams')

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
  revalidatePath('/pulse/admin/teams')
  revalidatePath(`/pulse/admin/teams/${id}`)

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
  revalidatePath(`/pulse/admin/teams/${teamId}`)

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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return {
    url: `${baseUrl}/pulse/t/${team.slug}?k=${token}`,
    token,
  }
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
