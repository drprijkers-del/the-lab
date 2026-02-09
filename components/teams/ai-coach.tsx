'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'
import type { CoachInsight, CoachStatus, CrossTeamPattern } from '@/domain/coach/actions'
import { getCoachStatus, generateCoachInsight, generateCrossTeamInsights } from '@/domain/coach/actions'
import type { SubscriptionTier } from '@/domain/billing/tiers'

interface AiCoachProps {
  teamId: string
  teamName: string
  subscriptionTier: SubscriptionTier
}

export function AiCoach({ teamId, teamName, subscriptionTier }: AiCoachProps) {
  const t = useTranslation()
  const [status, setStatus] = useState<CoachStatus | null>(null)
  const [insight, setInsight] = useState<CoachInsight | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Cross-team state (TC only)
  const [crossTeamPatterns, setCrossTeamPatterns] = useState<CrossTeamPattern[]>([])
  const [crossTeamGenerating, setCrossTeamGenerating] = useState(false)

  const showCrossTeam = subscriptionTier === 'transition_coach'

  const fetchStatus = useCallback(async () => {
    try {
      const s = await getCoachStatus(teamId)
      setStatus(s)
      if (s.cachedInsight) {
        setInsight(s.cachedInsight)
      }
    } catch {
      // Silently handle — status is non-critical
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const result = await generateCoachInsight(teamId)
      setInsight(result)
      // Refresh status to update daily counter
      const s = await getCoachStatus(teamId)
      setStatus(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('aiCoachError'))
    } finally {
      setGenerating(false)
    }
  }

  const handleCrossTeam = async () => {
    setCrossTeamGenerating(true)
    try {
      const patterns = await generateCrossTeamInsights()
      setCrossTeamPatterns(patterns)
    } catch {
      // Silently handle
    } finally {
      setCrossTeamGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-stone-200 dark:bg-stone-700 rounded" />
        <div className="h-4 w-72 bg-stone-200 dark:bg-stone-700 rounded" />
        <div className="h-32 bg-stone-200 dark:bg-stone-700 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">{t('aiCoachTitle')}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">{t('aiCoachSubtitle')}</p>
          </div>
        </div>

        {/* Usage frame */}
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700 p-3 mt-4">
          <p className="text-xs text-stone-500 dark:text-stone-400 text-center italic">
            {t('coachUsageFrame')}
          </p>
        </div>
      </div>

      {/* Generate / New Data Badge */}
      {(!insight || (status?.hasNewData && !generating)) && (
        <div className="text-center space-y-3">
          {status?.hasNewData && insight && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{t('aiCoachNewDataBadge')}</span>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            loading={generating}
            disabled={generating || (status?.dailyGenerationsLeft === 0)}
            className="w-full max-w-sm mx-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {generating ? t('aiCoachGenerating') : t('aiCoachGenerate')}
          </Button>

          {status?.dailyGenerationsLeft !== undefined && status.dailyGenerationsLeft < MAX_DAILY && (
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {status.dailyGenerationsLeft === 0
                ? t('aiCoachDailyLimitReached')
                : `${status.dailyGenerationsLeft}/5 ${t('aiCoachDailyLimit')}`}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Insight Result */}
      {insight && (
        <div className="space-y-6">
          {/* Observations */}
          {insight.observations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('aiCoachObservations')}</h4>
                {insight.fromCache && insight.generatedAt && (
                  <span className="text-[10px] text-stone-400 dark:text-stone-500">
                    {t('aiCoachFromCache')} {new Date(insight.generatedAt).toLocaleDateString('nl-NL')}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {insight.observations.map((obs, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{obs.title}</h5>
                        <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">{obs.body}</p>
                        {obs.dataPoints.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('aiCoachDataPoints')}</p>
                            {obs.dataPoints.map((dp, dpIdx) => (
                              <p key={dpIdx} className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                {dp}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          {insight.questions.length > 0 && (
            <div>
              <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-3">{t('aiCoachQuestions')}</h4>
              <div className="space-y-3">
                {insight.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-stone-800 dark:text-stone-200 text-sm font-medium leading-relaxed italic">
                          &ldquo;{q.question}&rdquo;
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                          <span className="font-medium">{t('aiCoachReasoning')}:</span> {q.reasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regenerate button when insight already shown */}
          {status?.hasNewData && (
            <div className="text-center">
              <button
                onClick={handleGenerate}
                disabled={generating || status.dailyGenerationsLeft === 0}
                className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 font-medium disabled:opacity-50"
              >
                {generating ? t('aiCoachGenerating') : t('aiCoachGenerate')}
              </button>
            </div>
          )}

          {/* Tips */}
          <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
            <h5 className="font-medium text-stone-700 dark:text-stone-300 text-sm mb-2">
              {t('coachTipsTitle')}
            </h5>
            <ul className="text-xs text-stone-500 dark:text-stone-400 space-y-1">
              <li>&bull; {t('coachTip1')}</li>
              <li>&bull; {t('coachTip2')}</li>
              <li>&bull; {t('coachTip3')}</li>
              <li>&bull; {t('coachTip4')}</li>
            </ul>
          </div>

          <p className="text-xs text-stone-400 dark:text-stone-500 text-center italic">
            {t('coachPostureHint')}
          </p>
        </div>
      )}

      {/* Cross-team Patterns (TC tier only) */}
      {showCrossTeam && (
        <div className="border-t border-stone-200 dark:border-stone-700 pt-6 space-y-4">
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100">{t('crossTeamTitle')}</h4>
            <p className="text-sm text-stone-500 dark:text-stone-400">{t('crossTeamSubtitle')}</p>
          </div>

          {crossTeamPatterns.length === 0 && (
            <Button
              onClick={handleCrossTeam}
              loading={crossTeamGenerating}
              variant="secondary"
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {crossTeamGenerating ? t('crossTeamGenerating') : t('crossTeamGenerate')}
            </Button>
          )}

          {crossTeamPatterns.length > 0 && (
            <div className="space-y-3">
              {crossTeamPatterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
                >
                  <p className="text-stone-800 dark:text-stone-200 text-sm font-medium mb-2">{pattern.pattern}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">{t('crossTeamTeams')}:</span>
                    {pattern.teams.map((teamName, tIdx) => (
                      <span key={tIdx} className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                        {teamName}
                      </span>
                    ))}
                  </div>
                  <div className="bg-white/60 dark:bg-stone-800/60 rounded-lg p-3">
                    <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">{t('crossTeamSuggestion')}</p>
                    <p className="text-sm text-stone-700 dark:text-stone-300">{pattern.suggestion}</p>
                  </div>
                </div>
              ))}

              <div className="text-center">
                <button
                  onClick={handleCrossTeam}
                  disabled={crossTeamGenerating}
                  className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium disabled:opacity-50"
                >
                  {crossTeamGenerating ? t('crossTeamGenerating') : t('crossTeamGenerate')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const MAX_DAILY = 5
