'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import type { TeamMetrics, DailyVibe, VibeInsight } from './types'
import {
  buildVibeMetric,
  calculateMomentum,
  calculateConfidence,
  calculateTrend,
  hasMinimumData,
  calculateDayState,
  calculateWeekState,
  calculateDataMaturity,
} from './calculations'

// =============================================================================
// INSIGHT TEMPLATES - Bilingual, neutral, professional language
// =============================================================================

type Language = 'nl' | 'en'

interface InsightTemplate {
  id: string
  type: VibeInsight['type']
  severity: VibeInsight['severity']
  message: { nl: string; en: string }
  detail?: { nl: string; en: string }
  suggestions?: { nl: string[]; en: string[] }
}

// Helper to interpolate values into template strings
function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (str, [key, val]) => str.replace(new RegExp(`{${key}}`, 'g'), String(val)),
    template
  )
}

// Insight templates with neutral, professional language
const INSIGHT_TEMPLATES = {
  // Participation insights
  lowParticipation: {
    id: 'low-participation',
    type: 'participation' as const,
    severity: 'info' as const,
    message: {
      nl: 'Beperkte data vandaag',
      en: 'Limited data today',
    },
    detail: {
      nl: '{today} van {teamSize} teamleden hebben ingecheckt.',
      en: '{today} of {teamSize} team members have checked in.',
    },
    suggestions: {
      nl: [
        'Deel de check-in link als herinnering',
        'Check of het tijdstip werkt voor het team',
      ],
      en: [
        'Share the check-in link as a reminder',
        'Check if the timing works for the team',
      ],
    },
  },

  participationImproving: {
    id: 'participation-improving',
    type: 'participation' as const,
    severity: 'info' as const,
    message: {
      nl: 'Deelname neemt toe',
      en: 'Participation is increasing',
    },
    detail: {
      nl: 'Meer teamleden checken regelmatig in dan vorige week.',
      en: 'More team members are checking in regularly compared to last week.',
    },
  },

  // Trend insights
  decliningTrend: {
    id: 'declining-trend',
    type: 'trend' as const,
    severity: 'attention' as const,
    message: {
      nl: 'Pulse is al {days} dagen lager',
      en: 'Pulse has been lower for {days} days',
    },
    detail: {
      nl: 'Dit patroon kan wijzen op toegenomen druk of uitdagingen.',
      en: 'This pattern may indicate increased pressure or challenges.',
    },
    suggestions: {
      nl: [
        'Check in met het team over de workload',
        'Bekijk recente veranderingen die het team kunnen beïnvloeden',
        'Bespreek dit in de volgende retrospective',
      ],
      en: [
        'Check in with the team about workload',
        'Review any recent changes that might have impacted the team',
        'Consider discussing in the next retrospective',
      ],
    },
  },

  risingTrend: {
    id: 'rising-trend',
    type: 'trend' as const,
    severity: 'info' as const,
    message: {
      nl: 'Pulse verbetert al {days} dagen',
      en: 'Pulse has been improving for {days} days',
    },
    detail: {
      nl: 'Het team lijkt in een positieve trend te zitten.',
      en: 'The team appears to be in a positive trend.',
    },
    suggestions: {
      nl: [
        'Noteer wat hieraan bijdraagt',
        'Leg lessen vast die kunnen helpen dit vast te houden',
      ],
      en: [
        'Note what might be contributing to this',
        'Capture learnings that could help sustain it',
      ],
    },
  },

  weekDrop: {
    id: 'week-drop',
    type: 'trend' as const,
    severity: 'attention' as const,
    message: {
      nl: 'Duidelijke daling ten opzichte van vorige week',
      en: 'Notable drop compared to last week',
    },
    detail: {
      nl: 'Week pulse is {delta} lager dan de vorige week.',
      en: 'Week pulse is {delta} lower than the previous week.',
    },
    suggestions: {
      nl: [
        'Wat is er deze week veranderd?',
        'Zijn er externe factoren die het team beïnvloeden?',
        'Ligt de sprint op schema?',
      ],
      en: [
        'What changed this week?',
        'Are there external factors affecting the team?',
        'Is the sprint on track?',
      ],
    },
  },

  weekImprovement: {
    id: 'week-improvement',
    type: 'trend' as const,
    severity: 'info' as const,
    message: {
      nl: 'Week pulse is verbeterd',
      en: 'Week pulse has improved',
    },
    detail: {
      nl: 'Week pulse is {delta} hoger dan de vorige week.',
      en: 'Week pulse is {delta} higher than the previous week.',
    },
  },

  // Pattern insights
  underPressure: {
    id: 'under-pressure',
    type: 'pattern' as const,
    severity: 'warning' as const,
    message: {
      nl: 'Week pulse duidt op druk',
      en: 'Week pulse indicates pressure',
    },
    detail: {
      nl: 'Het team gemiddelde suggereert aanhoudende stress of uitdagingen.',
      en: 'The team average suggests sustained stress or challenges.',
    },
    suggestions: {
      nl: [
        'Voer een open gesprek over de workload',
        'Bekijk sprint scope en commitments',
        'Check voor blockers of onduidelijke prioriteiten',
      ],
      en: [
        'Have an open conversation about workload',
        'Review sprint scope and commitments',
        'Check for blockers or unclear priorities',
      ],
    },
  },

  highConfidence: {
    id: 'high-confidence',
    type: 'pattern' as const,
    severity: 'info' as const,
    message: {
      nl: 'Team is in goede staat',
      en: 'Team is in good shape',
    },
    detail: {
      nl: 'De pulse is consistent hoog met goede deelname.',
      en: 'The pulse is consistently high with good participation.',
    },
  },

  mixedSignals: {
    id: 'mixed-signals',
    type: 'pattern' as const,
    severity: 'info' as const,
    message: {
      nl: 'Gemengde signalen deze week',
      en: 'Mixed signals this week',
    },
    detail: {
      nl: 'De scores variëren - sommige teamleden ervaren het anders.',
      en: 'Scores vary - some team members may be experiencing things differently.',
    },
    suggestions: {
      nl: [
        'De retro kan helpen om perspectief te krijgen',
        'Check individueel in waar gepast',
      ],
      en: [
        'The retro can help get perspective',
        'Check in individually where appropriate',
      ],
    },
  },

  consistentlyStable: {
    id: 'consistently-stable',
    type: 'pattern' as const,
    severity: 'info' as const,
    message: {
      nl: 'Stabiele week pulse',
      en: 'Stable week pulse',
    },
    detail: {
      nl: 'Het team houdt een steady state aan.',
      en: 'The team is maintaining a steady state.',
    },
  },

  // Milestone insights
  streakMilestone: {
    id: 'streak-milestone',
    type: 'milestone' as const,
    severity: 'info' as const,
    message: {
      nl: '{days} dagen consistent inchecken',
      en: '{days} days of consistent check-ins',
    },
    detail: {
      nl: 'Het team bouwt een solide meetgeschiedenis op.',
      en: 'The team is building a solid measurement history.',
    },
  },

  firstWeekComplete: {
    id: 'first-week-complete',
    type: 'milestone' as const,
    severity: 'info' as const,
    message: {
      nl: 'Eerste week data compleet',
      en: 'First week of data complete',
    },
    detail: {
      nl: 'Nu kunnen we week-over-week trends gaan vergelijken.',
      en: 'We can now start comparing week-over-week trends.',
    },
  },
}

// Helper to build an insight from a template
function buildInsight(
  template: InsightTemplate,
  lang: Language,
  values: Record<string, string | number> = {}
): VibeInsight {
  return {
    id: template.id,
    type: template.type,
    severity: template.severity,
    message: interpolate(template.message[lang], values),
    detail: template.detail ? interpolate(template.detail[lang], values) : undefined,
    suggestions: template.suggestions ? template.suggestions[lang] : undefined,
  }
}

/**
 * Get comprehensive metrics for a team
 */
export async function getTeamMetrics(teamId: string): Promise<TeamMetrics | null> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  // Verify team access and get expected_team_size
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id, expected_team_size')
    .eq('id', teamId)
    .single()

  if (!team) return null
  if (adminUser.role !== 'super_admin' && team.owner_id !== adminUser.id) {
    return null
  }

  // Get participant count (people who have checked in)
  const { count: participantCount } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)

  const actualParticipants = participantCount || 0
  // Use expected_team_size if set, otherwise fall back to actual participants
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

  // Count unique days with data in this week (Mon-Sun)
  const uniqueDaysThisWeek = new Set(last7Days.map(d => d.date)).size
  const dayOfWeek = new Date().getDay() // 0 = Sunday
  const isEndOfWeek = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 // Fri, Sat, Sun
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

  return {
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
}

/**
 * Generate insights from team metrics
 * Uses bilingual templates with neutral, professional language
 */
export async function getTeamInsights(
  teamId: string,
  language: Language = 'en'
): Promise<VibeInsight[]> {
  const metrics = await getTeamMetrics(teamId)
  if (!metrics) return []

  const insights: VibeInsight[] = []

  // ==========================================================================
  // FALSE ALARM PREVENTION
  // ==========================================================================
  // Don't generate trend/pattern insights without enough data
  const hasEnoughForTrends = metrics.hasEnoughData && metrics.weekVibe.confidence !== 'low'
  const hasEnoughForPatterns = metrics.hasEnoughData && metrics.weekVibe.entryCount >= 5

  // ==========================================================================
  // PARTICIPATION INSIGHTS (always show if relevant)
  // ==========================================================================

  // Low participation today
  if (metrics.liveVibe.confidence === 'low' && metrics.participation.teamSize > 0) {
    insights.push(
      buildInsight(INSIGHT_TEMPLATES.lowParticipation, language, {
        today: metrics.participation.today,
        teamSize: metrics.participation.teamSize,
      })
    )
  }

  // Participation improving (compare today vs historical)
  if (
    metrics.participation.trend === 'rising' &&
    metrics.participation.rate >= 50 &&
    metrics.hasEnoughData
  ) {
    insights.push(buildInsight(INSIGHT_TEMPLATES.participationImproving, language))
  }

  // ==========================================================================
  // TREND INSIGHTS (require minimum data)
  // ==========================================================================

  if (hasEnoughForTrends) {
    // Declining trend (3+ consecutive days)
    if (metrics.momentum.direction === 'declining' && metrics.momentum.daysTrending >= 3) {
      insights.push(
        buildInsight(INSIGHT_TEMPLATES.decliningTrend, language, {
          days: metrics.momentum.daysTrending,
        })
      )
    }

    // Rising trend (3+ consecutive days)
    if (metrics.momentum.direction === 'rising' && metrics.momentum.daysTrending >= 3) {
      insights.push(
        buildInsight(INSIGHT_TEMPLATES.risingTrend, language, {
          days: metrics.momentum.daysTrending,
        })
      )
    }

    // Week-over-week comparison (requires both weeks of data)
    if (metrics.weekVibe.value && metrics.previousWeekVibe.value) {
      const weekDelta = metrics.weekVibe.value - metrics.previousWeekVibe.value

      // Significant drop (>= 0.5)
      if (weekDelta <= -0.5) {
        insights.push(
          buildInsight(INSIGHT_TEMPLATES.weekDrop, language, {
            delta: Math.abs(weekDelta).toFixed(1),
          })
        )
      }

      // Significant improvement (>= 0.5)
      if (weekDelta >= 0.5) {
        insights.push(
          buildInsight(INSIGHT_TEMPLATES.weekImprovement, language, {
            delta: weekDelta.toFixed(1),
          })
        )
      }
    }
  }

  // ==========================================================================
  // PATTERN INSIGHTS (require higher confidence)
  // ==========================================================================

  if (hasEnoughForPatterns) {
    // Under pressure zone
    if (metrics.weekVibe.zone === 'under_pressure') {
      insights.push(buildInsight(INSIGHT_TEMPLATES.underPressure, language))
    }

    // High confidence zone (sustained good performance)
    if (
      metrics.weekVibe.zone === 'high_confidence' &&
      metrics.momentum.direction !== 'declining'
    ) {
      insights.push(buildInsight(INSIGHT_TEMPLATES.highConfidence, language))
    }

    // Mixed signals (moderate variation in scores)
    if (metrics.weekVibe.zone === 'mixed_signals') {
      insights.push(buildInsight(INSIGHT_TEMPLATES.mixedSignals, language))
    }

    // Consistently stable (steady state zone with stable momentum)
    if (
      metrics.weekVibe.zone === 'steady_state' &&
      metrics.momentum.direction === 'stable'
    ) {
      insights.push(buildInsight(INSIGHT_TEMPLATES.consistentlyStable, language))
    }
  }

  // ==========================================================================
  // MILESTONE INSIGHTS (positive reinforcement)
  // ==========================================================================

  // Streak milestones (7, 14, 30 days)
  if (metrics.momentum.daysTrending >= 7 && metrics.momentum.direction !== 'declining') {
    const milestone =
      metrics.momentum.daysTrending >= 30 ? 30 :
      metrics.momentum.daysTrending >= 14 ? 14 : 7

    if (metrics.momentum.daysTrending === milestone || metrics.momentum.daysTrending === milestone + 1) {
      insights.push(
        buildInsight(INSIGHT_TEMPLATES.streakMilestone, language, {
          days: milestone,
        })
      )
    }
  }

  // Limit to most relevant insights (max 3)
  return insights.slice(0, 3)
}

/**
 * Get the fly animation frequency based on metrics
 * Returns 'none' | 'rare' | 'medium' | 'high'
 */
export async function getFlyFrequency(teamId: string): Promise<'none' | 'rare' | 'medium' | 'high'> {
  const metrics = await getTeamMetrics(teamId)
  if (!metrics || !metrics.hasEnoughData) return 'rare'

  // High frequency: under pressure for 3+ days
  if (
    metrics.weekVibe.zone === 'under_pressure' &&
    metrics.momentum.direction === 'declining' &&
    metrics.momentum.daysTrending >= 3
  ) {
    return 'high'
  }

  // Medium: declining trend
  if (metrics.momentum.direction === 'declining' && metrics.momentum.daysTrending >= 2) {
    return 'medium'
  }

  // Rare: occasional appearance for healthy teams
  return 'rare'
}
