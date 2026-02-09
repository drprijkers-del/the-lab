/**
 * Account-Level Subscription Tiers
 *
 * One subscription per user covers all their teams.
 * Tiers are named after buyer roles.
 */

export type SubscriptionTier = 'free' | 'scrum_master' | 'agile_coach' | 'transition_coach'

export type CoachMode = 'none' | 'smart' | 'ai' | 'ai_cross_team'

export interface TierConfig {
  maxTeams: number
  price: string       // Mollie amount format (e.g. '9.99')
  mollieDesc: string  // Mollie subscription description
  coachMode: CoachMode
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  free:             { maxTeams: 1,  price: '0.00',  mollieDesc: '',                            coachMode: 'none' },
  scrum_master:     { maxTeams: 3,  price: '9.99',  mollieDesc: 'Pulse Labs Scrum Master',     coachMode: 'smart' },
  agile_coach:      { maxTeams: 10, price: '24.99', mollieDesc: 'Pulse Labs Agile Coach',      coachMode: 'ai' },
  transition_coach: { maxTeams: 25, price: '49.99', mollieDesc: 'Pulse Labs Transition Coach', coachMode: 'ai_cross_team' },
}

export const TIER_ORDER: SubscriptionTier[] = ['free', 'scrum_master', 'agile_coach', 'transition_coach']

export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier !== 'free'
}

export function getNextTier(current: SubscriptionTier): SubscriptionTier | null {
  const idx = TIER_ORDER.indexOf(current)
  if (idx === -1 || idx >= TIER_ORDER.length - 1) return null
  return TIER_ORDER[idx + 1]
}

export function getTierForTeamCount(count: number): SubscriptionTier {
  for (const tier of TIER_ORDER) {
    if (count <= TIERS[tier].maxTeams) return tier
  }
  return 'transition_coach'
}
