'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/context'
import { CoachQuestions } from '@/components/teams/coach-questions'
import { ProGate } from '@/components/teams/pro-gate'
import type { WowSessionWithStats } from '@/domain/wow/types'
import type { SubscriptionTier } from '@/domain/billing/tiers'
import { generateCoachInsight, generateCrossTeamInsights, type CoachInsight, type CrossTeamPattern } from '@/domain/coach/actions'

interface CoachSectionProps {
  teamId: string
  teamName: string
  teamPlan: string
  subscriptionTier: SubscriptionTier
  vibeAverageScore: number | null
  vibeParticipation: number
  wowSessions: WowSessionWithStats[]
}

type CoachMode = 'team_status' | 'team_patterns' | 'cross_team' | 'tips' | 'chat' | null

export function CoachSection({
  teamId,
  teamName,
  teamPlan,
  subscriptionTier,
  vibeAverageScore,
  vibeParticipation,
  wowSessions,
}: CoachSectionProps) {
  const { language, t } = useLanguage()

  const [showCoachFlow, setShowCoachFlow] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('coach_flow_visible')
    return stored === null ? true : stored === 'true'
  })

  const [activeMode, setActiveMode] = useState<CoachMode>('team_status')

  // Saved observations state — persisted per team in localStorage
  const storageKey = `coach_saved_${teamId}`
  const [savedObservations, setSavedObservations] = useState<Array<{ id: string; title: string; body: string; dataPoints: string[] }>>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })
  const [showSaved, setShowSaved] = useState(true)

  // AI insights state
  const [teamStatusInsight, setTeamStatusInsight] = useState<CoachInsight | null>(null)
  const [teamPatternsInsight, setTeamPatternsInsight] = useState<CoachInsight | null>(null)
  const [crossTeamPatterns, setCrossTeamPatterns] = useState<CrossTeamPattern[]>([])
  const [loadingTeamStatus, setLoadingTeamStatus] = useState(false)
  const [loadingTeamPatterns, setLoadingTeamPatterns] = useState(false)
  const [loadingCrossTeam, setLoadingCrossTeam] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleSaveObservation = (obs: { id: string; title: string; body: string; dataPoints: string[] }) => {
    setSavedObservations(prev => {
      const exists = prev.find(o => o.id === obs.id)
      const next = exists ? prev.filter(o => o.id !== obs.id) : [...prev, obs]
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const isObservationSaved = (id: string) => {
    return savedObservations.some(o => o.id === id)
  }

  const toggleCoachFlow = () => {
    setShowCoachFlow(prev => {
      const next = !prev
      localStorage.setItem('coach_flow_visible', String(next))
      return next
    })
  }

  const handleGenerateTeamStatus = async () => {
    console.log('🔍 Starting Team Status analysis...', { teamId, language })
    setLoadingTeamStatus(true)
    setError(null)
    try {
      const insight = await generateCoachInsight(teamId, 'general', language)
      console.log('✅ Team Status insight generated:', insight)
      setTeamStatusInsight(insight)
    } catch (err) {
      console.error('❌ Team Status generation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
    } finally {
      setLoadingTeamStatus(false)
    }
  }

  const handleGenerateTeamPatterns = async () => {
    setLoadingTeamPatterns(true)
    setError(null)
    try {
      const insight = await generateCoachInsight(teamId, 'patterns', language)
      setTeamPatternsInsight(insight)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate patterns')
    } finally {
      setLoadingTeamPatterns(false)
    }
  }

  const handleGenerateCrossTeam = async () => {
    setLoadingCrossTeam(true)
    setError(null)
    try {
      const patterns = await generateCrossTeamInsights(language)
      setCrossTeamPatterns(patterns)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cross-team patterns')
    } finally {
      setLoadingCrossTeam(false)
    }
  }

  const deltaTensions = wowSessions
    .filter(s => s.status === 'closed' && s.overall_score != null && s.overall_score < 3.5)
    .map(s => ({ area: s.angle, score: s.overall_score as number }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)

  const isAgileCoachTier = teamPlan === 'pro' && (subscriptionTier === 'agile_coach' || subscriptionTier === 'transition_coach')
  const isTransitionCoach = subscriptionTier === 'transition_coach'

  return (
    <div className="space-y-6 pt-3">
      {/* Title and preparation flow - collapsible */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            {t('coachPreparationTitle')}
          </h2>
          <button
            onClick={toggleCoachFlow}
            className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
            title={showCoachFlow ? 'Hide flow' : 'Show flow'}
          >
            <svg
              className={`w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-transform ${
                showCoachFlow ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="accordion-content" data-open={showCoachFlow}>
          <div className="space-y-3">
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {t('coachPreparationTagline')}
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {t('coachPreparationFlow')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[t('coachStep1'), t('coachStep2'), t('coachStep3'), t('coachStep4')].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-stone-700 dark:text-stone-300 leading-snug">{step}</span>
                </div>
              ))}
            </div>

            {/* AI Badge for Agile Coach tiers */}
            {isAgileCoachTier && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border border-emerald-200 dark:border-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {t('coachAiBadge')} • {subscriptionTier === 'transition_coach' && `${t('coachAiBadgeCrossTeam')} • `}{t('coachAiBadgeSuffix')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Free: ProGate paywall */}
      {teamPlan === 'free' && (
        <ProGate teamId={teamId} isPro={false} feature="billingCoachFeature">
          <CoachQuestions
            pulseScore={vibeAverageScore}
            pulseParticipation={vibeParticipation}
            deltaTensions={deltaTensions}
            teamName={teamName}
          />
        </ProGate>
      )}

      {/* Scrum Master: Smart Questions (rule-based) */}
      {teamPlan === 'pro' && subscriptionTier === 'scrum_master' && (
        <div className="space-y-6">
          {/* Explanation */}
          <div className="space-y-3">
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {t('smartQuestionsSubtitle')}
            </p>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-300 italic leading-snug">{t('coachQuestionsExample')}</span>
            </div>
          </div>

          <CoachQuestions
            pulseScore={vibeAverageScore}
            pulseParticipation={vibeParticipation}
            deltaTensions={deltaTensions}
            teamName={teamName}
          />
        </div>
      )}

      {/* Agile Coach + Transition Coach: AI Analysis */}
      {isAgileCoachTier && (
        <>
          {/* Mobile: Accordion style - each tile followed by its content */}
          <div className="lg:hidden space-y-2">
            {/* Team Status - mobile */}
            <div>
              <button
                onClick={() => setActiveMode(activeMode === 'team_status' ? null : 'team_status')}
                className={`w-full flex items-start gap-2 px-3 py-2.5 text-left group transition-all ${
                  activeMode === 'team_status'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 dark:border-emerald-600 rounded-t-lg border-b-0'
                    : 'bg-stone-50 dark:bg-stone-700/30 border-2 border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 rounded-lg'
                }`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium leading-snug ${
                    activeMode === 'team_status' ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-900 dark:text-stone-100'
                  }`}>{t('coachModeTeamStatus')}</div>
                </div>
              </button>
              {activeMode === 'team_status' && (
                <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-b-xl border-2 border-t-0 border-emerald-500 dark:border-emerald-600 p-4 space-y-4">
                  {/* Description + Action row */}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-stone-600 dark:text-stone-300">{t('coachModeTeamStatusDesc')}</p>
                    <button
                      className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {t('analyze')}
                    </button>
                  </div>

                  {/* Example observations */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('aiCoachObservations')}</h4>
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl overflow-hidden divide-y divide-emerald-100 dark:divide-emerald-700">
                      {/* Example observation 1 */}
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <div className="flex-1 min-w-0 opacity-40">
                            <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{t('coachExampleObsTitle')}</h5>
                            <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">{t('coachExampleObsBody')}</p>
                            <div className="mt-3 space-y-1">
                              <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('coachDataPoints')}</p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                {t('coachExampleObsData')}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleSaveObservation({
                              id: 'example-1',
                              title: t('coachExampleObsTitle'),
                              body: t('coachExampleObsBody'),
                              dataPoints: [t('coachExampleObsData')]
                            })}
                            className="shrink-0 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors group"
                            title={isObservationSaved('example-1') ? t('coachRemoveFromSelection') : t('coachSaveObservation')}
                          >
                            <svg
                              className={`w-5 h-5 transition-colors ${
                                isObservationSaved('example-1')
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'fill-none text-stone-400 dark:text-stone-500 group-hover:text-amber-500'
                              }`}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Example observation 2 */}
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <div className="flex-1 min-w-0 opacity-40">
                            <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{t('coachExampleObsTitle')}</h5>
                            <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">{t('coachExampleObs2BodyShort')}</p>
                            <div className="mt-3 space-y-1">
                              <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('coachDataPoints')}</p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                {t('coachExampleObsData')}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleSaveObservation({
                              id: 'example-2',
                              title: t('coachExampleObsTitle'),
                              body: t('coachExampleObs2BodyShort'),
                              dataPoints: [t('coachExampleObsData')]
                            })}
                            className="shrink-0 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors group"
                            title={isObservationSaved('example-2') ? t('coachRemoveFromSelection') : t('coachSaveObservation')}
                          >
                            <svg
                              className={`w-5 h-5 transition-colors ${
                                isObservationSaved('example-2')
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'fill-none text-stone-400 dark:text-stone-500 group-hover:text-amber-500'
                              }`}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Saved observations section - collapsible */}
                  {savedObservations.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-700">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          {t('coachMySelection')} ({savedObservations.length})
                        </h4>
                        <button
                          onClick={() => setShowSaved(!showSaved)}
                          className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
                          title={showSaved ? 'Hide' : 'Show'}
                        >
                          <svg
                            className={`w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-transform ${
                              showSaved ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      <div className="accordion-content" data-open={showSaved}>
                        <div className="space-y-2">
                          {savedObservations.map((obs) => (
                            <div key={obs.id} className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{obs.title}</h5>
                                  <p className="text-stone-700 dark:text-stone-300 text-xs leading-relaxed">{obs.body}</p>
                                </div>
                                <button
                                  onClick={() => toggleSaveObservation(obs)}
                                  className="shrink-0 p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                  title={t('coachRemoveFromSelection')}
                                >
                                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Team Patterns - mobile */}
            <div>
              <button
                onClick={() => setActiveMode(activeMode === 'team_patterns' ? null : 'team_patterns')}
                className={`w-full flex items-start gap-2 px-3 py-2.5 text-left group transition-all ${
                  activeMode === 'team_patterns'
                    ? 'bg-cyan-100 dark:bg-cyan-900/30 border-2 border-cyan-500 dark:border-cyan-600 rounded-t-lg border-b-0'
                    : 'bg-stone-50 dark:bg-stone-700/30 border-2 border-transparent hover:border-cyan-200 dark:hover:border-cyan-800 hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 rounded-lg'
                }`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-cyan-500 to-cyan-600">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium leading-snug ${
                    activeMode === 'team_patterns' ? 'text-cyan-700 dark:text-cyan-300' : 'text-stone-900 dark:text-stone-100'
                  }`}>{t('coachModeTeamPatterns')}</div>
                </div>
              </button>
              {activeMode === 'team_patterns' && (
                <div className="bg-cyan-100 dark:bg-cyan-900/30 rounded-b-xl border-2 border-t-0 border-cyan-500 dark:border-cyan-600 p-4 space-y-4">
                  {/* Description + Action */}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-stone-600 dark:text-stone-300">{t('coachModeteamPatternsDesc')}</p>
                    <button className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {t('analyze')}
                    </button>
                  </div>
                  <div className="text-center py-12 opacity-40">
                    <p className="text-sm text-stone-500 dark:text-stone-400">{t('coachPatternPlaceholder')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cross-Team - mobile (TC only) */}
            {isTransitionCoach && (
              <div>
                <button
                  onClick={() => setActiveMode(activeMode === 'cross_team' ? null : 'cross_team')}
                  className={`w-full flex items-start gap-2 px-3 py-2.5 text-left group transition-all ${
                    activeMode === 'cross_team'
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500 dark:border-purple-600 rounded-t-lg border-b-0'
                      : 'bg-stone-50 dark:bg-stone-700/30 border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 rounded-lg'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-purple-500 to-purple-600">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium leading-snug ${
                      activeMode === 'cross_team' ? 'text-purple-700 dark:text-purple-300' : 'text-stone-900 dark:text-stone-100'
                    }`}>{t('coachModeCrossTeam')}</div>
                  </div>
                </button>
                {activeMode === 'cross_team' && (
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-b-xl border-2 border-t-0 border-purple-500 dark:border-purple-600 p-4 space-y-4">
                    {/* Description + Action */}
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-stone-600 dark:text-stone-300">{t('coachModeCrossTeamDesc')}</p>
                      <button className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {t('analyze')}
                      </button>
                    </div>
                    <div className="text-center py-12 opacity-40">
                      <p className="text-sm text-stone-500 dark:text-stone-400">{t('coachCrossTeamPlaceholder')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tips - mobile */}
            <div>
              <button
                onClick={() => setActiveMode(activeMode === 'tips' ? null : 'tips')}
                className={`w-full flex items-start gap-2 px-3 py-2.5 text-left group transition-all ${
                  activeMode === 'tips'
                    ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500 dark:border-amber-600 rounded-t-lg border-b-0'
                    : 'bg-stone-50 dark:bg-stone-700/30 border-2 border-transparent hover:border-amber-200 dark:hover:border-amber-800 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 rounded-lg'
                }`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-500 to-amber-600">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium leading-snug ${
                    activeMode === 'tips' ? 'text-amber-700 dark:text-amber-300' : 'text-stone-900 dark:text-stone-100'
                  }`}>{t('coachModeTips')}</div>
                </div>
              </button>
              {activeMode === 'tips' && (
                <div className="bg-amber-100 dark:bg-amber-900/30 rounded-b-xl border-2 border-t-0 border-amber-500 dark:border-amber-600 p-4 space-y-4">
                  {/* Description */}
                  <p className="text-sm text-stone-600 dark:text-stone-300">{t('coachModeTipsDesc')}</p>

                  <div className="text-center py-12 opacity-40">
                    <p className="text-sm text-stone-500 dark:text-stone-400">{t('coachTipsPlaceholder')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat - mobile */}
            <div>
              <button
                onClick={() => setActiveMode(activeMode === 'chat' ? null : 'chat')}
                className={`w-full flex items-start gap-2 px-3 py-2.5 text-left group transition-all ${
                  activeMode === 'chat'
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-600 rounded-t-lg border-b-0'
                    : 'bg-stone-50 dark:bg-stone-700/30 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 rounded-lg'
                }`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500 to-blue-600">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium leading-snug ${
                    activeMode === 'chat' ? 'text-blue-700 dark:text-blue-300' : 'text-stone-900 dark:text-stone-100'
                  }`}>{t('coachModeChat')}</div>
                </div>
              </button>
              {activeMode === 'chat' && (
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-b-xl border-2 border-t-0 border-blue-500 dark:border-blue-600 p-4 space-y-4">
                  {/* Description */}
                  <p className="text-sm text-stone-600 dark:text-stone-300">{t('coachModeChatDesc')}</p>

                  <div className="space-y-4">
                    {/* Chat input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t('coachChatPlaceholder')}
                        className="flex-1 px-4 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                        {t('chat')}
                      </button>
                    </div>
                    <div className="text-center py-8 opacity-40">
                      <p className="text-xs text-stone-500 dark:text-stone-400">{t('coachChatInterfacePlaceholder')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Tiles + Content layout */}
          <div className="hidden lg:block space-y-4">
            {/* Analysis Mode Tiles - Horizontal Row */}
            <div className={`grid gap-2 ${isTransitionCoach ? 'grid-cols-5' : 'grid-cols-4'}`}>
              {/* Team Status Analysis */}
              <button
                onClick={() => setActiveMode(activeMode === 'team_status' ? null : 'team_status')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  activeMode === 'team_status'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600 shadow-md'
                    : 'bg-stone-50 dark:bg-stone-800 border-transparent hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
                }`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className={`text-xs font-medium text-center ${
                  activeMode === 'team_status'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-stone-700 dark:text-stone-300'
                }`}>
                  {t('coachModeTeamStatus')}
                </div>
                {activeMode === 'team_status' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-emerald-400 dark:border-t-emerald-600" />
                )}
              </button>

              {/* Team Patterns */}
              <button
                onClick={() => setActiveMode(activeMode === 'team_patterns' ? null : 'team_patterns')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  activeMode === 'team_patterns'
                    ? 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-400 dark:border-cyan-600 shadow-md'
                    : 'bg-stone-50 dark:bg-stone-800 border-transparent hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10'
                }`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 to-cyan-600">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className={`text-xs font-medium text-center ${
                  activeMode === 'team_patterns'
                    ? 'text-cyan-700 dark:text-cyan-300'
                    : 'text-stone-700 dark:text-stone-300'
                }`}>
                  {t('coachModeTeamPatterns')}
                </div>
                {activeMode === 'team_patterns' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-cyan-400 dark:border-t-cyan-600" />
                )}
              </button>

              {/* Cross-Team Patterns (TC only) */}
              {isTransitionCoach && (
                <button
                  onClick={() => setActiveMode(activeMode === 'cross_team' ? null : 'cross_team')}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    activeMode === 'cross_team'
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600 shadow-md'
                      : 'bg-stone-50 dark:bg-stone-800 border-transparent hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className={`text-xs font-medium text-center ${
                    activeMode === 'cross_team'
                      ? 'text-purple-700 dark:text-purple-300'
                      : 'text-stone-700 dark:text-stone-300'
                  }`}>
                    {t('coachModeCrossTeam')}
                  </div>
                  {activeMode === 'cross_team' && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-purple-400 dark:border-t-purple-600" />
                  )}
                </button>
              )}

              {/* Approach Tips */}
              <button
                onClick={() => setActiveMode(activeMode === 'tips' ? null : 'tips')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  activeMode === 'tips'
                    ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 shadow-md'
                    : 'bg-stone-50 dark:bg-stone-800 border-transparent hover:bg-amber-50/50 dark:hover:bg-amber-900/10'
                }`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className={`text-xs font-medium text-center ${
                  activeMode === 'tips'
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-stone-700 dark:text-stone-300'
                }`}>
                  {t('coachModeTips')}
                </div>
                {activeMode === 'tips' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-amber-400 dark:border-t-amber-600" />
                )}
              </button>

              {/* AI Chat */}
              <button
                onClick={() => setActiveMode(activeMode === 'chat' ? null : 'chat')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  activeMode === 'chat'
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 shadow-md'
                    : 'bg-stone-50 dark:bg-stone-800 border-transparent hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                }`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className={`text-xs font-medium text-center ${
                  activeMode === 'chat'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-stone-700 dark:text-stone-300'
                }`}>
                  {t('coachModeChat')}
                </div>
                {activeMode === 'chat' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-blue-400 dark:border-t-blue-600" />
                )}
              </button>
            </div>

            {/* Active Mode Content Area */}
            <div className="space-y-4">
            {activeMode === 'team_status' && (
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-6 space-y-6 rounded-xl">
              {/* Description + Action row */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-stone-600 dark:text-stone-300">{t('coachModeTeamStatusDesc')}</p>
                <button
                  onClick={handleGenerateTeamStatus}
                  disabled={loadingTeamStatus}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {loadingTeamStatus ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {t('analyze')}
                    </>
                  )}
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Observations */}
              {teamStatusInsight && teamStatusInsight.observations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">Observaties</h4>
                  <div className="bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl overflow-hidden divide-y divide-emerald-100 dark:divide-emerald-700">
                    {teamStatusInsight.observations.map((obs, idx) => (
                      <div key={`obs-${idx}`} className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{obs.title}</h5>
                            <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">{obs.body}</p>
                            {obs.dataPoints.length > 0 && (
                              <div className="mt-3 space-y-1">
                                <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('coachDataPoints')}</p>
                                {obs.dataPoints.map((dp, dpIdx) => (
                                  <p key={dpIdx} className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                    {dp}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => toggleSaveObservation({
                              id: `team-status-${idx}`,
                              title: obs.title,
                              body: obs.body,
                              dataPoints: obs.dataPoints
                            })}
                            className="shrink-0 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors group"
                            title={isObservationSaved(`team-status-${idx}`) ? t('coachRemoveFromSelection') : t('coachSaveObservation')}
                          >
                            <svg
                              className={`w-5 h-5 transition-colors ${
                                isObservationSaved(`team-status-${idx}`)
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'fill-none text-stone-400 dark:text-stone-500 group-hover:text-amber-500'
                              }`}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaching Questions */}
              {teamStatusInsight && teamStatusInsight.questions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('coachCoachingQuestions')}</h4>
                  <div className="space-y-2">
                    {teamStatusInsight.questions.map((q, idx) => (
                      <div key={`q-${idx}`} className="p-4 rounded-lg bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-700">
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-2">{q.question}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 italic">{q.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insufficient data state */}
              {teamStatusInsight && teamStatusInsight.observations.length === 0 && teamStatusInsight.questions.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto text-amber-300 dark:text-amber-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h4 className="font-medium text-stone-900 dark:text-stone-100 mb-2">{t('coachNoInsights')}</h4>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                    {t('coachNoInsightsDesc')}
                    {teamStatusInsight.fromCache && (
                      <><br/><span className="text-amber-600 dark:text-amber-400">{t('coachCachedAnalysis')} {new Date(teamStatusInsight.generatedAt).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US')}.</span></>
                    )}
                  </p>
                  {teamStatusInsight.fromCache ? (
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {t('coachCacheRefreshHint')}
                    </p>
                  ) : (
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {t('coachAddMoreDataHint')}
                    </p>
                  )}
                </div>
              )}

              {/* Example preview when no insights yet */}
              {!teamStatusInsight && !loadingTeamStatus && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('coachExampleObservations')}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">Preview</span>
                    </div>
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl overflow-hidden divide-y divide-emerald-100 dark:divide-emerald-700 opacity-50">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{t('coachExampleObs1Title')}</h5>
                            <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
                              {t('coachExampleObs1Body')}
                            </p>
                            <div className="mt-3 space-y-1">
                              <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('coachDataPoints')}</p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                {t('coachExampleData1')}
                              </p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                {t('coachExampleData2')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{t('coachExampleObs2Title')}</h5>
                            <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
                              {t('coachExampleObs2Body')}
                            </p>
                            <div className="mt-3 space-y-1">
                              <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('coachDataPoints')}</p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                {t('coachExampleData3')}
                              </p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                {t('coachExampleData4')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('coachExampleQuestions')}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">Preview</span>
                    </div>
                    <div className="space-y-2 opacity-50">
                      <div className="p-4 rounded-lg bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-700">
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-2">
                          {t('coachExampleQ1')}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                          {t('coachExampleQ1Reason')}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-700">
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-2">
                          {t('coachExampleQ2')}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                          {t('coachExampleQ2Reason')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-8 border-t border-emerald-200 dark:border-emerald-700">
                    <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">
                      {t('coachExampleHint')}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {t('coachExampleCta')}
                    </p>
                  </div>
                </>
              )}

            </div>
          )}

          {activeMode === 'team_patterns' && (
            <div className="bg-cyan-100 dark:bg-cyan-900/30 p-6 space-y-6 rounded-xl">
              {/* Description + Action */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-stone-600 dark:text-stone-300">{t('coachModeteamPatternsDesc')}</p>
                <button
                  onClick={() => handleGenerateTeamPatterns()}
                  disabled={loadingTeamPatterns}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {loadingTeamPatterns ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {t('analyze')}
                    </>
                  )}
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Pattern Observations */}
              {teamPatternsInsight && teamPatternsInsight.observations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('coachPatternObservations')}</h4>
                  <div className="bg-cyan-50/50 dark:bg-cyan-900/20 rounded-xl overflow-hidden divide-y divide-cyan-100 dark:divide-cyan-700">
                    {teamPatternsInsight.observations.map((obs, idx) => (
                      <div key={`pattern-obs-${idx}`} className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{obs.title}</h5>
                            <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">{obs.body}</p>
                            {obs.dataPoints.length > 0 && (
                              <div className="mt-3 space-y-1">
                                <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('coachDataPoints')}</p>
                                {obs.dataPoints.map((dp, dpIdx) => (
                                  <p key={dpIdx} className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" />
                                    {dp}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => toggleSaveObservation({
                              id: `pattern-${idx}`,
                              title: obs.title,
                              body: obs.body,
                              dataPoints: obs.dataPoints
                            })}
                            className="shrink-0 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors group"
                            title={isObservationSaved(`pattern-${idx}`) ? t('coachRemoveFromSelection') : t('coachSaveObservation')}
                          >
                            <svg
                              className={`w-5 h-5 transition-colors ${
                                isObservationSaved(`pattern-${idx}`)
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'fill-none text-stone-400 dark:text-stone-500 group-hover:text-amber-500'
                              }`}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions */}
              {teamPatternsInsight && teamPatternsInsight.questions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('coachCoachingQuestions')}</h4>
                  <div className="space-y-2">
                    {teamPatternsInsight.questions.map((q, idx) => (
                      <div key={`pattern-q-${idx}`} className="p-4 rounded-lg bg-white dark:bg-stone-800 border border-cyan-200 dark:border-cyan-700">
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-2">{q.question}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 italic">{q.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!teamPatternsInsight && !loadingTeamPatterns && (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{t('coachPatternEmpty')}</p>
                </div>
              )}
            </div>
          )}

          {activeMode === 'cross_team' && (
            <div className="bg-purple-100 dark:bg-purple-900/30 p-6 space-y-6 rounded-xl">
              {/* Description + Action */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-stone-600 dark:text-stone-300">{t('coachCrossTeamDesc')}</p>
                <button
                  onClick={handleGenerateCrossTeam}
                  disabled={loadingCrossTeam}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {loadingCrossTeam ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {t('analyze')}
                    </>
                  )}
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Cross-Team Patterns */}
              {crossTeamPatterns.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('coachCrossTeamTitle')}</h4>
                  <div className="space-y-3">
                    {crossTeamPatterns.map((pattern, idx) => (
                      <div key={`cross-${idx}`} className="p-4 rounded-lg bg-white dark:bg-stone-800 border border-purple-200 dark:border-purple-700">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="w-7 h-7 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-2">{pattern.pattern}</h5>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {pattern.teams.map((team, tIdx) => (
                                <span key={tIdx} className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                  {team}
                                </span>
                              ))}
                            </div>
                            <div className="mt-2 p-3 rounded bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-400">
                              <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">{t('coachSuggestion')}</p>
                              <p className="text-sm text-stone-700 dark:text-stone-300">{pattern.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {crossTeamPatterns.length === 0 && !loadingCrossTeam && (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{t('coachCrossTeamEmpty')}</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">{t('coachRequiresMinTeams')}</p>
                </div>
              )}
            </div>
          )}

          {activeMode === 'tips' && (
            <div className="bg-amber-100 dark:bg-amber-900/30 p-6 space-y-6 rounded-xl">
              {/* Description */}
              <p className="text-sm text-stone-600 dark:text-stone-300">{t('coachTipsIntro')}</p>

              {/* Tips Grid */}
              <div className="space-y-3">
                <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{t('coachCoachingTips')}</h4>
                <div className="grid gap-3">
                  {/* Tip 1 */}
                  <div className="p-4 rounded-lg bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-700">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{t('coachTipStartTitle')}</h5>
                        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {t('coachTipStartBody')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tip 2 */}
                  <div className="p-4 rounded-lg bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-700">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{t('coachTipDataTitle')}</h5>
                        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {t('coachTipDataBody')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tip 3 */}
                  <div className="p-4 rounded-lg bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-700">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🤔</span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{t('coachTipOpenTitle')}</h5>
                        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {t('coachTipOpenBody')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tip 4 */}
                  <div className="p-4 rounded-lg bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-700">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">👂</span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{t('coachTipPatternsTitle')}</h5>
                        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {t('coachTipPatternsBody')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tip 5 */}
                  <div className="p-4 rounded-lg bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-700">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎬</span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{t('coachTipOwnershipTitle')}</h5>
                        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {t('coachTipOwnershipBody')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tip 6 */}
                  <div className="p-4 rounded-lg bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-700">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📊</span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{t('coachTipSaveTitle')}</h5>
                        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {t('coachTipSaveBody')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tip 7 */}
                  <div className="p-4 rounded-lg bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-700">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🔄</span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{t('coachTipFollowUpTitle')}</h5>
                        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {t('coachTipFollowUpBody')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMode === 'chat' && (
            <div className="bg-blue-100 dark:bg-blue-900/30 flex flex-col rounded-xl min-h-[500px]">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-blue-200 dark:border-blue-800">
                <p className="text-sm text-stone-600 dark:text-stone-300">{t('coachBrainstormDesc')}</p>
              </div>

              {/* Chat messages area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {/* Welcome message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-white dark:bg-stone-800 border border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-stone-700 dark:text-stone-300">
                      {t('coachChatWelcome')}
                    </p>
                    <p className="text-sm text-stone-700 dark:text-stone-300 mt-2">
                      {t('coachChatExamples')}
                    </p>
                  </div>
                </div>

                {/* Coming soon message */}
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    </span>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {t('coachComingSoonLabel')}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-3">
                    {t('coachChatComingSoonBody')}
                  </p>
                </div>
              </div>

              {/* Chat input (disabled for now) */}
              <div className="p-4 sm:p-6 border-t border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('coachChatDisabled')}
                    disabled
                    className="flex-1 px-4 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 placeholder:text-stone-400 dark:placeholder:text-stone-500 cursor-not-allowed"
                  />
                  <button
                    disabled
                    className="px-4 py-2.5 bg-stone-300 dark:bg-stone-700 text-stone-500 dark:text-stone-400 rounded-lg text-sm font-medium cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {t('coachSend')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Saved observations — always visible when present */}
          {savedObservations.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  {t('coachMySelection')} ({savedObservations.length})
                </h4>
                <button
                  onClick={() => setShowSaved(!showSaved)}
                  className="p-1 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors group"
                >
                  <svg
                    className={`w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-transform ${showSaved ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {showSaved && (
                <div className="space-y-2">
                  {savedObservations.map((obs) => (
                    <div key={obs.id} className="bg-white dark:bg-stone-800 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">{obs.title}</h5>
                          <p className="text-stone-700 dark:text-stone-300 text-xs leading-relaxed">{obs.body}</p>
                        </div>
                        <button
                          onClick={() => toggleSaveObservation(obs)}
                          className="shrink-0 p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                          title={t('coachRemoveFromSelection')}
                        >
                          <svg className="w-4 h-4 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
        </>
      )}
    </div>
  )
}
