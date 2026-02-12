/**
 * Account-Level Subscription Tiers
 *
 * One subscription per user covers all their teams.
 * Tiers are named after buyer roles.
 */

export type SubscriptionTier = 'free' | 'scrum_master' | 'agile_coach' | 'transition_coach'

export type CoachMode = 'none' | 'smart' | 'ai'

export type WowLevelId = 'shu' | 'ha' | 'ri'

export interface TierFeatures {
  maxAngles: number
  trendDays: number
  wowLevels: WowLevelId[]
  coach: boolean
  crossTeam: boolean
}

export interface TierConfig {
  maxTeams: number
  price: string       // Mollie amount format (e.g. '14.99')
  mollieDesc: string  // Mollie subscription description
  coachMode: CoachMode
  features: TierFeatures
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    maxTeams: 1,
    price: '0.00',
    mollieDesc: '',
    coachMode: 'none',
    features: {
      maxAngles: 5,
      trendDays: 7,
      wowLevels: ['shu'],
      coach: false,
      crossTeam: false,
    },
  },
  scrum_master: {
    maxTeams: 3,
    price: '14.99',
    mollieDesc: 'Pulse Labs Scrum Master',
    coachMode: 'smart',
    features: {
      maxAngles: 15,
      trendDays: 30,
      wowLevels: ['shu', 'ha', 'ri'],
      coach: true,
      crossTeam: false,
    },
  },
  agile_coach: {
    maxTeams: 10,
    price: '29.99',
    mollieDesc: 'Pulse Labs Agile Coach',
    coachMode: 'ai',
    features: {
      maxAngles: 15,
      trendDays: 30,
      wowLevels: ['shu', 'ha', 'ri'],
      coach: true,
      crossTeam: true,
    },
  },
  transition_coach: {
    maxTeams: 25,
    price: '59.99',
    mollieDesc: 'Pulse Labs Transition Coach',
    coachMode: 'ai',
    features: {
      maxAngles: 15,
      trendDays: 30,
      wowLevels: ['shu', 'ha', 'ri'],
      coach: true,
      crossTeam: true,
    },
  },
}

export const TIER_ORDER: SubscriptionTier[] = ['free', 'scrum_master', 'agile_coach', 'transition_coach']

export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier !== 'free'
}

export function getFeaturesForTier(tier: SubscriptionTier): TierFeatures {
  return TIERS[tier].features
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
