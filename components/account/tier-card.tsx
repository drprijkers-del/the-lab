'use client'

import { useTranslation } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import type { SubscriptionTier } from '@/domain/billing/tiers'

interface TierCardProps {
  tier: SubscriptionTier
  isCurrent: boolean
  isDowngrade: boolean
  loading: boolean
  onSelect: (tier: SubscriptionTier) => void
}

export function TierCard({ tier, isCurrent, isDowngrade, loading, onSelect }: TierCardProps) {
  const t = useTranslation()
  const isPaid = tier !== 'free'

  const config: Record<SubscriptionTier, {
    name: string
    price: string
    priceNote: string
    teams: string
    color: string
    bgCurrent: string
    borderCurrent: string
  }> = {
    free: {
      name: t('tierFree'),
      price: t('tierPriceFree'),
      priceNote: '',
      teams: t('tierTeams1'),
      color: 'text-stone-600 dark:text-stone-400',
      bgCurrent: 'bg-stone-50 dark:bg-stone-800',
      borderCurrent: 'border-stone-300 dark:border-stone-600',
    },
    scrum_master: {
      name: t('tierScrumMaster'),
      price: '€9,99',
      priceNote: t('tierPerMonth'),
      teams: t('tierTeams3'),
      color: 'text-cyan-700 dark:text-cyan-400',
      bgCurrent: 'bg-cyan-50 dark:bg-cyan-900/20',
      borderCurrent: 'border-cyan-400 dark:border-cyan-600',
    },
    agile_coach: {
      name: t('tierAgileCoach'),
      price: '€24,99',
      priceNote: t('tierPerMonth'),
      teams: t('tierTeams10'),
      color: 'text-purple-700 dark:text-purple-400',
      bgCurrent: 'bg-purple-50 dark:bg-purple-900/20',
      borderCurrent: 'border-purple-400 dark:border-purple-600',
    },
    transition_coach: {
      name: t('tierTransitionCoach'),
      price: '€49,99',
      priceNote: t('tierPerMonth'),
      teams: t('tierTeams25'),
      color: 'text-amber-700 dark:text-amber-400',
      bgCurrent: 'bg-amber-50 dark:bg-amber-900/20',
      borderCurrent: 'border-amber-400 dark:border-amber-600',
    },
  }

  const c = config[tier]

  return (
    <div className={`relative flex flex-col rounded-xl border-2 p-5 transition-all ${
      isCurrent
        ? `${c.bgCurrent} ${c.borderCurrent}`
        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
    }`}>
      {/* Current badge */}
      {isCurrent && (
        <span className="absolute -top-3 left-4 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500 text-white">
          {t('tierCurrentBadge')}
        </span>
      )}

      {/* Tier name */}
      <h3 className={`text-base font-bold ${c.color}`}>{c.name}</h3>

      {/* Price */}
      <div className="mt-3 mb-1">
        <span className="text-3xl font-bold text-stone-900 dark:text-stone-100">{c.price}</span>
        {c.priceNote && (
          <span className="text-sm text-stone-500 dark:text-stone-400 ml-1">{c.priceNote}</span>
        )}
      </div>

      {/* Team count — the key differentiator */}
      <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-4">{c.teams}</p>

      {/* Feature summary */}
      <div className="flex-1 mb-5">
        {isPaid ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-stone-600 dark:text-stone-300">{t('tierFeatureAllAngles')}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-stone-600 dark:text-stone-300">{t('tierFeature30dTrends')}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-stone-600 dark:text-stone-300">{t('tierFeatureHaRi')}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-stone-600 dark:text-stone-300">{
                tier === 'transition_coach' ? t('tierFeatureCoachTC') :
                tier === 'agile_coach' ? t('tierFeatureCoachAC') :
                t('tierFeatureCoachSM')
              }</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-stone-500 dark:text-stone-400">{t('tierFeatureFreeAngles')}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-stone-500 dark:text-stone-400">{t('tierFeature7dTrends')}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-stone-500 dark:text-stone-400">{t('tierFeatureShuOnly')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action button */}
      {!isCurrent && isPaid && (
        <Button
          onClick={() => onSelect(tier)}
          loading={loading}
          className="w-full"
          size="sm"
        >
          {isDowngrade ? t('tierDowngradeButton') : t('tierUpgradeButton')}
        </Button>
      )}

      {isCurrent && (
        <div className="text-center text-xs font-medium text-stone-400 dark:text-stone-500 py-2">
          {t('tierYourPlan')}
        </div>
      )}

      {!isCurrent && !isPaid && (
        <div className="py-2" />
      )}
    </div>
  )
}
