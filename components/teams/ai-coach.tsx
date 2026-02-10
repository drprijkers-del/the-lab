'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
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

      {/* ── Section 1: How it works + Primary CTA ── */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">

        {/* How it works — 3 steps so user understands the flow */}
        {!insight && !generating && (
          <div className="mb-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <span className="text-sm text-stone-700 dark:text-stone-300">{t('coachFlowStep1')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <span className="text-sm text-stone-700 dark:text-stone-300">{t('coachFlowStep2')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <span className="text-sm text-stone-700 dark:text-stone-300">{t('coachFlowStep3')}</span>
              </div>
            </div>
          </div>
        )}

        {/* New data badge */}
        {status?.hasNewData && insight && !generating && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{t('aiCoachNewDataBadge')}</span>
          </div>
        )}

        {/* Primary CTA */}
        {(!insight || (status?.hasNewData && !generating)) && (
          <div className="space-y-2">
            <Button
              onClick={handleGenerate}
              loading={generating}
              disabled={generating || (status?.dailyGenerationsLeft === 0)}
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {generating ? t('aiCoachGenerating') : t('aiCoachGenerate')}
            </Button>

            {status?.dailyGenerationsLeft !== undefined && status.dailyGenerationsLeft < MAX_DAILY && (
              <p className="text-[10px] text-stone-400 dark:text-stone-500 text-center">
                {status.dailyGenerationsLeft === 0
                  ? t('aiCoachDailyLimitReached')
                  : `${status.dailyGenerationsLeft}/5 ${t('aiCoachDailyLimit')}`}
              </p>
            )}
          </div>
        )}

        {/* Perspective selector — secondary, below CTA */}
        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700/50">
          <div className="relative">
            <button
              onClick={() => setLensOpen(!lensOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
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
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* ── Section 2: Results ── */}
      {insight && (
        <div className="space-y-5">
          {/* Action prompt — tells user what to do with these results */}
          <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <span className="text-lg shrink-0">&#x1f3af;</span>
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{t('coachPickPrompt')}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{t('coachPickDetail')}</p>
            </div>
          </div>

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

          {/* Disclaimer — AI is assistive, not authoritative */}
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center italic">
            {t('aiCoachDisclaimer')}
          </p>

          {/* Regenerate when new data */}
          {status?.hasNewData && (
            <div className="text-center">
              <button
                onClick={handleGenerate}
                disabled={generating || status.dailyGenerationsLeft === 0}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium disabled:opacity-50"
              >
                {generating ? t('aiCoachGenerating') : t('aiCoachGenerate')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Section 3: Cross-team Patterns (TC only) ── */}
      {showCrossTeam && (
        <div className="border-t border-stone-200 dark:border-stone-700 pt-6 space-y-4">
          <div>
            <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('crossTeamTitle')}</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('crossTeamSubtitle')}</p>
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
                    {pattern.teams.map((tn, tIdx) => (
                      <span key={tIdx} className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                        {tn}
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
