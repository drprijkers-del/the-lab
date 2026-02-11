'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import type { CoachInsight, CoachStatus, CrossTeamPattern } from '@/domain/coach/actions'
import { getCoachStatus, generateCoachInsight, generateCrossTeamInsights } from '@/domain/coach/actions'
import type { SubscriptionTier } from '@/domain/billing/tiers'
import type { CoachLens } from '@/domain/coach/lenses'
import type { TranslationKey } from '@/lib/i18n/translations'

const LENS_OPTIONS: { id: CoachLens; labelKey: TranslationKey; descKey: TranslationKey }[] = [
  { id: 'general', labelKey: 'lensGeneral', descKey: 'lensGeneralDesc' },
  { id: 'product_vs_component', labelKey: 'lensProductComponent', descKey: 'lensProductComponentDesc' },
  { id: 'obeya', labelKey: 'lensObeya', descKey: 'lensObeyaDesc' },
]

const MAX_DAILY = 5

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
  const [activeLens, setActiveLens] = useState<CoachLens>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(`coach-lens-${teamId}`) as CoachLens) || 'general'
    }
    return 'general'
  })
  const [lensOpen, setLensOpen] = useState(false)

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

  const handleLensChange = (lens: CoachLens) => {
    setActiveLens(lens)
    setLensOpen(false)
    localStorage.setItem(`coach-lens-${teamId}`, lens)
    setInsight(null)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const result = await generateCoachInsight(teamId, activeLens)
      setInsight(result)
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

      {/* Context + Lens */}
      <div className="space-y-3">
        <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          {t('aiCoachSubtitle')}
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
          {t('aiCoachContextLine')}
        </p>

        {/* New data badge */}
        {status?.hasNewData && insight && !generating && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{t('aiCoachNewDataBadge')}</span>
          </div>
        )}

        {/* Perspective selector */}
        <div className="relative">
          <button
            onClick={() => setLensOpen(!lensOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors rounded-full bg-stone-50 dark:bg-stone-700/30 border border-stone-200 dark:border-stone-700"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {t('coachLensLabel')}: {t(LENS_OPTIONS.find(l => l.id === activeLens)?.labelKey || 'lensGeneral')}
            <svg className={`w-3 h-3 transition-transform ${lensOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {lensOpen && (
            <div className="absolute left-0 top-full mt-1 z-20 w-72 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg overflow-hidden">
              {LENS_OPTIONS.map((lens) => (
                <button
                  key={lens.id}
                  onClick={() => handleLensChange(lens.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors ${
                    activeLens === lens.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${activeLens === lens.id ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`} />
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{t(lens.labelKey)}</span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 ml-4">{t(lens.descKey)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Results */}
      {insight && (
        <div className="space-y-5">
          {/* Action prompt */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">{t('coachPickPrompt')}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1">{t('coachPickDetail')}</span>
            </div>
          </div>

          {/* Observations */}
          {insight.observations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('aiCoachObservations')}</h4>
                {insight.fromCache && insight.generatedAt && (
                  <span className="text-[10px] text-stone-400 dark:text-stone-500">
                    {t('aiCoachFromCache')} {new Date(insight.generatedAt).toLocaleDateString('nl-NL')}
                  </span>
                )}
              </div>
              <div className="bg-stone-50 dark:bg-stone-700/30 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-700">
                {insight.observations.map((obs, idx) => (
                  <div key={idx} className="p-4">
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
            <div className="space-y-3">
              <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('aiCoachQuestions')}</h4>
              <div className="bg-stone-50 dark:bg-stone-700/30 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-700">
                {insight.questions.map((q, idx) => (
                  <div key={idx} className="p-4">
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

          {/* "How to bring this up" */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 dark:bg-stone-700/30">
            <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-600 text-stone-500 dark:text-stone-400 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </span>
            <div>
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">{t('coachPlayItOut')}</span>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 italic leading-relaxed">{t('coachPlayItOutText')}</p>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center italic">
            {t('aiCoachDisclaimer')}
          </p>

          {/* Regenerate — row style when there's new data */}
          {status?.hasNewData && !generating && (
            <div className="bg-stone-50 dark:bg-stone-700/30 rounded-xl overflow-hidden">
              <button
                onClick={handleGenerate}
                disabled={generating || (status?.dailyGenerationsLeft === 0)}
                className="flex items-center gap-3 p-4 w-full text-left group hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <span className="block text-sm font-medium text-stone-600 dark:text-stone-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {t('aiCoachGenerate')}
                  </span>
                  {status?.dailyGenerationsLeft !== undefined && status.dailyGenerationsLeft < MAX_DAILY && (
                    <span className="block text-[10px] text-stone-400 dark:text-stone-500">
                      {status.dailyGenerationsLeft === 0
                        ? t('aiCoachDailyLimitReached')
                        : `${status.dailyGenerationsLeft}/5 ${t('aiCoachDailyLimit')}`}
                    </span>
                  )}
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Primary CTA — ghost tile (no results yet) */}
      {!insight && (
        <div className="bg-stone-50 dark:bg-stone-700/30 rounded-xl overflow-hidden">
          <button
            onClick={handleGenerate}
            disabled={generating || (status?.dailyGenerationsLeft === 0)}
            className="flex items-center gap-3 p-4 w-full text-left group hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-stone-200 dark:border-stone-600 group-hover:border-emerald-400 dark:group-hover:border-emerald-600 flex items-center justify-center transition-colors">
              {generating ? (
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )}
            </div>
            <div>
              <span className="block text-sm font-medium text-stone-400 dark:text-stone-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {generating ? t('aiCoachGenerating') : t('aiCoachGenerate')}
              </span>
              {status?.dailyGenerationsLeft !== undefined && status.dailyGenerationsLeft < MAX_DAILY && (
                <span className="block text-[10px] text-stone-400 dark:text-stone-500">
                  {status.dailyGenerationsLeft === 0
                    ? t('aiCoachDailyLimitReached')
                    : `${status.dailyGenerationsLeft}/5 ${t('aiCoachDailyLimit')}`}
                </span>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Cross-team Patterns (TC only) */}
      {showCrossTeam && (
        <div className="border-t border-stone-200 dark:border-stone-700 pt-6 space-y-4">
          <div>
            <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('crossTeamTitle')}</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('crossTeamSubtitle')}</p>
          </div>

          {crossTeamPatterns.length === 0 && (
            <div className="bg-stone-50 dark:bg-stone-700/30 rounded-xl overflow-hidden">
              <button
                onClick={handleCrossTeam}
                disabled={crossTeamGenerating}
                className="flex items-center gap-3 p-4 w-full text-left group hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg border-2 border-dashed border-stone-200 dark:border-stone-600 group-hover:border-purple-400 dark:group-hover:border-purple-600 flex items-center justify-center transition-colors">
                  {crossTeamGenerating ? (
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-stone-400 dark:text-stone-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {crossTeamGenerating ? t('crossTeamGenerating') : t('crossTeamGenerate')}
                </span>
              </button>
            </div>
          )}

          {crossTeamPatterns.length > 0 && (
            <div className="space-y-3">
              <div className="bg-stone-50 dark:bg-stone-700/30 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-700">
                {crossTeamPatterns.map((pattern, idx) => (
                  <div key={idx} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-stone-800 dark:text-stone-200 text-sm font-medium">{pattern.pattern}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 ml-10">
                      {pattern.teams.map((tn, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                          {tn}
                        </span>
                      ))}
                    </div>
                    <div className="ml-10 flex items-start gap-2.5 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                      <span className="text-[10px] font-medium text-purple-500 dark:text-purple-400 uppercase tracking-wider shrink-0 mt-0.5">{t('crossTeamSuggestion')}</span>
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-snug">{pattern.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={handleCrossTeam}
                  disabled={crossTeamGenerating}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors disabled:opacity-50"
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
