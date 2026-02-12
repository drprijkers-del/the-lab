'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'
import { ProGate } from '@/components/teams/pro-gate'
import type { WowSessionWithStats } from '@/domain/wow/types'
import type { SubscriptionTier } from '@/domain/billing/tiers'
import { TIERS } from '@/domain/billing/tiers'
import { generateCoachPreparation, generateRuleBasedPreparation, type CoachPreparation } from '@/domain/coach/actions'
import type { CrossTeamInsights } from '@/domain/coach/cross-team'

interface CoachSectionProps {
  teamId: string
  teamName: string
  teamPlan: string
  subscriptionTier: SubscriptionTier
  vibeAverageScore: number | null
  vibeParticipation: number
  wowSessions: WowSessionWithStats[]
  onNavigateToVibe?: () => void
  onNavigateToWow?: () => void
  crossTeamEnabled: boolean
  crossTeamData?: CrossTeamInsights | null
}

export function CoachSection({
  teamId,
  teamPlan,
  subscriptionTier,
  vibeAverageScore,
  wowSessions,
  onNavigateToVibe,
  onNavigateToWow,
  crossTeamEnabled,
  crossTeamData,
}: CoachSectionProps) {
  const { language, t } = useLanguage()

  const [preparation, setPreparation] = useState<CoachPreparation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasVibeData = vibeAverageScore !== null
  const hasWowData = wowSessions.some(s => s.status === 'closed')
  const hasAnyData = hasVibeData || hasWowData

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const coachMode = TIERS[subscriptionTier].coachMode
      const result = coachMode === 'smart'
        ? await generateRuleBasedPreparation(teamId, language)
        : await generateCoachPreparation(teamId, language)
      setPreparation(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Daily generation limit')) {
        setError(t('aiCoachDailyLimitReached'))
      } else {
        setError(t('aiCoachError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pt-3">
      {/* Title */}
      <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
        {t('coachPreparationTitle')}
      </h2>

      {/* Free tier: paywall */}
      {teamPlan === 'free' && (
        <ProGate teamId={teamId} isPro={false} feature="billingCoachFeature">
          <div className="h-48 rounded-xl bg-stone-100 dark:bg-stone-800" />
        </ProGate>
      )}

      {/* Paid tiers */}
      {teamPlan === 'pro' && (
        <div className="space-y-5">
          {/* Framing sentence */}
          <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
            {t('coachFramingSentence')}
          </p>

          {/* Empty state: not enough data */}
          {!hasAnyData && (
            <div className="rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700 p-4 sm:p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-stone-700 dark:text-stone-300 text-sm">{t('coachEmptyTitle')}</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">{t('coachEmptyDesc')}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button onClick={onNavigateToVibe} className="text-xs font-medium px-4 py-2.5 sm:py-2 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors touch-manipulation">
                  {t('coachGoToVibe')}
                </button>
                <button onClick={onNavigateToWow} className="text-xs font-medium px-4 py-2.5 sm:py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors touch-manipulation">
                  {t('coachGoToWow')}
                </button>
              </div>
            </div>
          )}

          {/* Has data: button + results */}
          {hasAnyData && (
            <div className="space-y-5">
              {/* Primary button */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('coachGenerating')}
                  </>
                ) : preparation ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('coachRegenerateButton')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t('coachPrepareButton')}
                  </>
                )}
              </button>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* 4-section output */}
              {preparation && (
                <div className="space-y-4">
                  {/* 1. Signal Summary */}
                  <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 p-3 sm:p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                      {t('coachSignalSummaryTitle')}
                    </h3>
                    <ul className="space-y-2">
                      {preparation.signalSummary.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                            bullet.signalSource === 'vibe' ? 'bg-pink-400' : 'bg-amber-400'
                          }`} />
                          <span className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{bullet.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 2. Primary Theme */}
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 sm:p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                      {t('coachPrimaryThemeTitle')}
                    </h3>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{preparation.primaryTheme.title}</p>
                    <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80 leading-relaxed">{preparation.primaryTheme.body}</p>
                  </div>

                  {/* 3. Conversation Questions */}
                  <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 p-3 sm:p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                      {t('coachQuestionsTitle')}
                    </h3>
                    <div className="space-y-3">
                      {preparation.conversationQuestions.map((q, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{q.question}</p>
                            {q.context && (
                              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 italic">
                                {t('coachWhyNow')}: {q.context}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Suggested Intervention */}
                  <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 border-l-4 border-emerald-500 p-3 sm:p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                      {t('coachInterventionTitle')}
                    </h3>
                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{preparation.suggestedIntervention.action}</p>
                    <ul className="space-y-1 text-xs text-stone-500 dark:text-stone-400">
                      {preparation.suggestedIntervention.timeframe && (
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          {preparation.suggestedIntervention.timeframe}
                        </li>
                      )}
                      {preparation.suggestedIntervention.format && (
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          {preparation.suggestedIntervention.format}
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Disclaimer */}
                  <p className="text-xs text-stone-400 dark:text-stone-500 text-center italic">
                    {t('aiCoachDisclaimer')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 5. Cross-Team Patterns — enabled */}
          {crossTeamEnabled && crossTeamData && crossTeamData.insights.length > 0 && (
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-3 sm:p-4 space-y-3">
              <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                {t('coachCrossTeamTitle')}
              </h3>
              <ul className="space-y-2">
                {crossTeamData.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 w-2 h-2 rounded-full shrink-0 bg-indigo-400" />
                    <span className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cross-team locked card — SM tier only */}
          {!crossTeamEnabled && (
            <div className="rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700 p-4 sm:p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto">
                <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-medium text-stone-700 dark:text-stone-300 text-sm">
                {t('coachCrossTeamLockedTitle')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                {t('coachCrossTeamLockedDesc')}
              </p>
              <Link
                href="/account/billing"
                className="inline-block text-xs font-medium px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
              >
                {t('coachCrossTeamUpgrade')}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
