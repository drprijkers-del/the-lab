'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getTeamContext } from '@/lib/tenant/context'

export interface MoodStats {
  average_mood: number
  total_entries: number
  distribution: Record<string, number>
}

export interface CheckinResult {
  success: boolean
  error?: string
  alreadyCheckedIn?: boolean
  streak?: number
  teamStats?: MoodStats
}

export async function submitMoodCheckin(
  mood: number,
  comment?: string,
  nickname?: string
): Promise<CheckinResult> {
  const context = await getTeamContext()

  if (!context) {
    return { success: false, error: 'No active team session' }
  }

  const supabase = await createAdminClient()

  // Get or create participant using deviceId from context
  const { data: participantId, error: participantError } = await supabase
    .rpc('get_or_create_participant', {
      p_team_id: context.teamId,
      p_device_id: context.deviceId,
      p_nickname: nickname || null,
    })

  if (participantError || !participantId) {
    return { success: false, error: 'Failed to register participant' }
  }

  // Submit mood
  const { data: result, error: moodError } = await supabase
    .rpc('submit_mood_checkin', {
      p_team_id: context.teamId,
      p_participant_id: participantId,
      p_mood: mood,
      p_comment: comment || null,
    })

  if (moodError) {
    return { success: false, error: moodError.message }
  }

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      alreadyCheckedIn: result.error === 'Already checked in today',
    }
  }

  // Get streak
  const { data: streak } = await supabase
    .rpc('get_participant_streak', { p_participant_id: participantId })

  // Get team stats
  const { data: teamStats } = await supabase
    .rpc('get_team_mood_stats', { p_team_id: context.teamId })

  return {
    success: true,
    streak: streak || 1,
    teamStats: teamStats as MoodStats,
  }
}

export async function getTeamMoodStats(): Promise<MoodStats | null> {
  const context = await getTeamContext()

  if (!context) return null

  const supabase = await createAdminClient()

  const { data } = await supabase
    .rpc('get_team_mood_stats', { p_team_id: context.teamId })

  return data as MoodStats
}

export async function getParticipantStreak(): Promise<number> {
  const context = await getTeamContext()

  if (!context) return 0

  const supabase = await createAdminClient()

  // Get participant using deviceId from context
  const { data: participant } = await supabase
    .from('participants')
    .select('id')
    .eq('team_id', context.teamId)
    .eq('device_id', context.deviceId)
    .single()

  if (!participant) return 0

  const { data: streak } = await supabase
    .rpc('get_participant_streak', { p_participant_id: participant.id })

  return streak || 0
}

export async function hasCheckedInToday(): Promise<boolean> {
  const context = await getTeamContext()

  if (!context) return false

  const supabase = await createAdminClient()

  // Get participant using deviceId from context
  const { data: participant } = await supabase
    .from('participants')
    .select('id')
    .eq('team_id', context.teamId)
    .eq('device_id', context.deviceId)
    .single()

  if (!participant) return false

  // Check for today's entry
  const today = new Date().toISOString().split('T')[0]
  const { data: entry } = await supabase
    .from('mood_entries')
    .select('id')
    .eq('participant_id', participant.id)
    .eq('entry_date', today)
    .single()

  return !!entry
}

export async function getTeamTrend(): Promise<{
  date: string
  average: number
  count: number
}[]> {
  const context = await getTeamContext()

  if (!context) return []

  const supabase = await createAdminClient()

  const { data } = await supabase
    .rpc('get_team_trend', { p_team_id: context.teamId })

  return data || []
}
