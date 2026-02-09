'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAdmin, AdminUser } from '@/lib/auth/admin'
import { hashToken, generateToken } from '@/lib/tenant/context'
import { revalidatePath } from 'next/cache'

export interface TeamFeedback {
  id: string
  team_id: string
  prompt_key: string
  response: string
  created_at: string
}

export interface FeedbackSubmission {
  prompt_key: string
  response: string
}

// Helper to verify team ownership
async function verifyTeamOwnership(teamId: string, adminUser: AdminUser): Promise<boolean> {
  if (adminUser.role === 'super_admin') return true

  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single()

  return data?.owner_id === adminUser.id
}

// Get or create feedback share link for a team
export async function getFeedbackShareLink(teamId: string): Promise<{ url: string; token: string } | null> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

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

  // Generate new token and create/update link
  const token = generateToken()
  const tokenHash = hashToken(token)

  // Deactivate old links and create new one
  await supabase
    .from('feedback_links')
    .update({ is_active: false })
    .eq('team_id', teamId)

  await supabase
    .from('feedback_links')
    .insert({ team_id: teamId, token_hash: tokenHash })

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()

  return {
    url: `${baseUrl}/feedback/t/${team.slug}?k=${token}`,
    token,
  }
}

// Deactivate feedback link
export async function deactivateFeedbackLink(teamId: string): Promise<{ success: boolean; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  if (!(await verifyTeamOwnership(teamId, adminUser))) {
    return { success: false, error: 'Geen toegang tot dit team' }
  }

  const { error } = await supabase
    .from('feedback_links')
    .update({ is_active: false })
    .eq('team_id', teamId)

  if (error) {
    return { success: false, error: 'Kon link niet deactiveren' }
  }

  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}

// Submit anonymous feedback (public, no auth required)
export async function submitFeedback(
  teamSlug: string,
  tokenHash: string,
  submissions: FeedbackSubmission[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient()

  // Validate link
  const { data: link } = await supabase
    .from('feedback_links')
    .select('id, team_id, expires_at')
    .eq('token_hash', tokenHash)
    .eq('is_active', true)
    .single()

  if (!link) {
    return { success: false, error: 'Link is niet geldig of verlopen' }
  }

  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { success: false, error: 'Link is verlopen' }
  }

  // Verify team slug matches
  const { data: team } = await supabase
    .from('teams')
    .select('id, slug')
    .eq('id', link.team_id)
    .single()

  if (!team || team.slug !== teamSlug) {
    return { success: false, error: 'Team niet gevonden' }
  }

  // Filter out empty submissions
  const validSubmissions = submissions.filter(s => s.response.trim().length > 0)

  if (validSubmissions.length === 0) {
    return { success: false, error: 'Geef minimaal één antwoord' }
  }

  // Insert feedback entries
  const feedbackEntries = validSubmissions.map(s => ({
    team_id: team.id,
    prompt_key: s.prompt_key,
    response: s.response.trim(),
  }))

  const { error } = await supabase
    .from('team_feedback')
    .insert(feedbackEntries)

  if (error) {
    return { success: false, error: 'Kon feedback niet opslaan' }
  }

  return { success: true }
}

// Get all feedback for a team (admin only)
export async function getTeamFeedback(teamId: string): Promise<TeamFeedback[]> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient() // Use admin client to bypass RLS

  if (!(await verifyTeamOwnership(teamId, adminUser))) {
    return []
  }

  const { data, error } = await supabase
    .from('team_feedback')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching feedback:', error)
    return []
  }

  return data || []
}

// Get feedback grouped by prompt
export async function getTeamFeedbackGrouped(teamId: string): Promise<Record<string, TeamFeedback[]>> {
  const feedback = await getTeamFeedback(teamId)

  const grouped: Record<string, TeamFeedback[]> = {}

  for (const item of feedback) {
    if (!grouped[item.prompt_key]) {
      grouped[item.prompt_key] = []
    }
    grouped[item.prompt_key].push(item)
  }

  return grouped
}

// Validate feedback token and get team info (for public page)
export async function validateFeedbackToken(teamSlug: string, token: string): Promise<{
  valid: boolean
  teamId?: string
  teamName?: string
  tokenHash?: string
  error?: string
}> {
  const supabase = await createAdminClient()
  const tokenHash = hashToken(token)

  // Get team by slug
  const { data: team } = await supabase
    .from('teams')
    .select('id, name, slug')
    .eq('slug', teamSlug)
    .single()

  if (!team) {
    return { valid: false, error: 'Team niet gevonden' }
  }

  // Check for valid active link
  const { data: link } = await supabase
    .from('feedback_links')
    .select('id, expires_at')
    .eq('team_id', team.id)
    .eq('token_hash', tokenHash)
    .eq('is_active', true)
    .single()

  if (!link) {
    return { valid: false, error: 'Link is niet geldig' }
  }

  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { valid: false, error: 'Link is verlopen' }
  }

  return {
    valid: true,
    teamId: team.id,
    teamName: team.name,
    tokenHash,
  }
}

// Clear all feedback for a team (admin only)
export async function clearTeamFeedback(teamId: string): Promise<{ success: boolean; error?: string }> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  if (!(await verifyTeamOwnership(teamId, adminUser))) {
    return { success: false, error: 'Geen toegang tot dit team' }
  }

  const { error } = await supabase
    .from('team_feedback')
    .delete()
    .eq('team_id', teamId)

  if (error) {
    return { success: false, error: 'Kon feedback niet wissen' }
  }

  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}
