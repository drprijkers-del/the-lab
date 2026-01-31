'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { UnifiedTeam, enableTool, disableTool, deleteTeam } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { useTranslation, TranslationFunction } from '@/lib/i18n/context'
import { PulseMetrics } from '@/components/admin/pulse-metrics'
import { ShareLinkSection } from '@/components/admin/share-link-section'
import type { TeamMetrics, PulseInsight } from '@/domain/metrics/types'
import type { DeltaSessionWithStats } from '@/domain/delta/types'

interface TeamDetailContentProps {
  team: UnifiedTeam
  pulseMetrics?: TeamMetrics | null
  pulseInsights?: PulseInsight[]
  deltaSessions?: DeltaSessionWithStats[]
}

type TabType = 'pulse' | 'delta' | 'feedback' | 'coach' | 'modules' | 'settings'

const ANGLE_LABELS: Record<string, string> = {
  scrum: 'Scrum',
  flow: 'Flow',
  ownership: 'Ownership',
  collaboration: 'Collaboration',
  technical_excellence: 'Technical Excellence',
  refinement: 'Refinement',
  planning: 'Planning',
  retro: 'Retro',
  demo: 'Demo',
}

export function TeamDetailContent({ team, pulseMetrics, pulseInsights = [], deltaSessions = [] }: TeamDetailContentProps) {
  const t = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial tab from URL or default based on enabled tools
  const getInitialTab = (): TabType => {
    const urlTab = searchParams.get('tab') as TabType | null
    const validTabs = ['pulse', 'delta', 'feedback', 'coach', 'modules', 'settings']
    if (urlTab && validTabs.includes(urlTab)) {
      // Only use URL tab if the tool is enabled (or it's a general tab)
      if (['settings', 'feedback', 'coach', 'modules'].includes(urlTab)) return urlTab
      if (team.tools_enabled.includes(urlTab as 'pulse' | 'delta')) return urlTab
    }
    // Default: first enabled tool or settings
    return team.tools_enabled.includes('pulse') ? 'pulse' :
           team.tools_enabled.includes('delta') ? 'delta' : 'settings'
  }

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab)
  const [loading, setLoading] = useState<string | null>(null)

  // Update tab when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlTab = searchParams.get('tab') as TabType | null
    const validTabs = ['pulse', 'delta', 'feedback', 'coach', 'modules', 'settings']
    if (urlTab && validTabs.includes(urlTab)) {
      if (['settings', 'feedback', 'coach', 'modules'].includes(urlTab) || team.tools_enabled.includes(urlTab as 'pulse' | 'delta')) {
        setActiveTab(urlTab)
      }
    }
  }, [searchParams, team.tools_enabled])

  const handleEnableTool = async (tool: 'pulse' | 'delta') => {
    setLoading(`enable-${tool}`)
    const result = await enableTool(team.id, tool)
    setLoading(null)

    if (!result.success) {
      alert(result.error || 'Er ging iets mis bij het activeren')
      return
    }

    // Switch to the newly enabled tab
    setActiveTab(tool)
    router.refresh()
  }

  const handleDisableTool = async (tool: 'pulse' | 'delta') => {
    setLoading(`disable-${tool}`)
    const result = await disableTool(team.id, tool)
    setLoading(null)

    if (!result.success) {
      alert(result.error || 'Er ging iets mis bij het uitschakelen')
      return
    }

    // Switch to settings tab after disabling
    setActiveTab('settings')
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm(t('teamDeleteConfirm'))) return
    setLoading('delete')
    await deleteTeam(team.id)
    router.push('/teams')
  }

  const tabs: { key: TabType; label: string; premium?: boolean }[] = [
    { key: 'pulse', label: t('teamsDetailPulse') },
    { key: 'delta', label: t('teamsDetailDelta') },
    { key: 'feedback', label: t('feedbackTitle') },
    { key: 'coach', label: t('coachQuestionsTab') },
    { key: 'modules', label: t('modulePremium'), premium: true },
    { key: 'settings', label: t('teamsDetailSettings') },
  ]

  return (
    <div className="space-y-6">
      {/* Team header */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{team.name}</h1>
          {team.needs_attention && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
              {t('teamsNeedsAttention')}
            </span>
          )}
          {/* Team Maturity Badge */}
          <TeamMaturityBadge
            sessionsCount={(team.delta?.total_sessions || 0) + (pulseMetrics?.maturity?.daysOfData || 0)}
            avgScore={team.pulse?.average_score || team.delta?.average_score || 0}
            t={t}
          />
        </div>
        {team.description && (
          <p className="text-stone-600 dark:text-stone-400">{team.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200 dark:border-stone-700 overflow-x-auto">
        <div className="flex gap-4 sm:gap-6 min-w-max">
          {tabs.map(({ key, label, premium }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === key
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              {label}
              {premium && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded">
                  PRO
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'pulse' && (
        <div className="space-y-6">
          {team.pulse ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left column: Metrics */}
              <div className="space-y-6">
                {pulseMetrics && (
                  <PulseMetrics metrics={pulseMetrics} insights={pulseInsights} />
                )}
              </div>

              {/* Right column: Share link & actions */}
              <div className="space-y-6">
                {/* Share link */}
                <ShareLinkSection teamId={team.id} teamSlug={team.slug} />

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Today's participation */}
                  <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
                    {(() => {
                      const effectiveSize = team.expected_team_size || team.pulse.participant_count || 1
                      const todayCount = team.pulse.today_entries
                      const percentage = effectiveSize > 0 ? Math.round((todayCount / effectiveSize) * 100) : 0
                      const isComplete = percentage >= 80
                      const isLow = percentage < 50 && effectiveSize > 0

                      return (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-bold ${
                              isComplete ? 'text-green-600 dark:text-green-400' :
                              isLow ? 'text-amber-600 dark:text-amber-400' :
                              'text-stone-900 dark:text-stone-100'
                            }`}>
                              {todayCount}/{effectiveSize}
                            </span>
                            <span className={`text-sm font-medium ${
                              isComplete ? 'text-green-600 dark:text-green-400' :
                              isLow ? 'text-amber-600 dark:text-amber-400' :
                              'text-stone-500 dark:text-stone-400'
                            }`}>
                              ({percentage}%)
                            </span>
                          </div>
                          <div className="text-sm text-stone-500 dark:text-stone-400">{t('statsTodayParticipation')}</div>
                          {/* Progress bar */}
                          <div className="mt-2 h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isComplete ? 'bg-green-500' :
                                isLow ? 'bg-amber-500' :
                                'bg-cyan-500'
                              }`}
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  {/* Total participants vs expected */}
                  <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                        {team.pulse.participant_count}
                      </span>
                      {team.expected_team_size && (
                        <span className="text-sm text-stone-500 dark:text-stone-400">
                          / {team.expected_team_size}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-stone-500 dark:text-stone-400">{t('adminParticipants')}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDisableTool('pulse')}
                    loading={loading === 'disable-pulse'}
                    className="text-red-600 hover:text-red-700"
                  >
                    {t('teamsToolDisable')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-stone-50 dark:bg-stone-800 rounded-xl">
              <div className="text-stone-400 dark:text-stone-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-700 dark:text-stone-300 mb-2">{t('teamsPulseNotEnabled')}</h3>
              <Button
                onClick={() => handleEnableTool('pulse')}
                loading={loading === 'enable-pulse'}
              >
                {t('teamsEnablePulse')}
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'delta' && (
        <div className="space-y-6">
          {team.delta ? (
            <>
              {/* Header with New Session button */}
              <div className="flex flex-col gap-4">
                {/* Stats row */}
                <div className="flex items-center gap-6 overflow-x-auto pb-2">
                  <div className="text-center shrink-0">
                    <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{team.delta.total_sessions}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">{t('sessions')}</div>
                  </div>
                  <div className="w-px h-8 bg-stone-200 dark:bg-stone-700 shrink-0" />
                  <div className="text-center shrink-0">
                    <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{team.delta.active_sessions}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">{t('active')}</div>
                  </div>
                  {team.delta.average_score && (
                    <>
                      <div className="w-px h-8 bg-stone-200 dark:bg-stone-700 shrink-0" />
                      <div className="text-center shrink-0">
                        <div className={`text-2xl font-bold ${
                          team.delta.average_score >= 4 ? 'text-green-600' :
                          team.delta.average_score >= 3 ? 'text-cyan-600' :
                          team.delta.average_score >= 2 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {team.delta.average_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">{t('teamsAvgScore')}</div>
                      </div>
                    </>
                  )}
                </div>
                {/* New Session button */}
                <Link href={`/teams/${team.id}/delta/new`}>
                  <Button className="w-full sm:w-auto">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('newSession')}
                  </Button>
                </Link>
              </div>

              {/* Sessions list */}
              {deltaSessions.length > 0 && (
                <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-700">
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">{t('sessions')}</h3>
                  </div>
                  <div className="divide-y divide-stone-100 dark:divide-stone-700">
                    {deltaSessions.map(session => (
                      <Link
                        key={session.id}
                        href={`/delta/session/${session.id}`}
                        className="flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                            session.status === 'active' ? 'bg-cyan-500' : 'bg-stone-400 dark:bg-stone-500'
                          }`}>
                            {(ANGLE_LABELS[session.angle] || session.angle).charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-stone-900 dark:text-stone-100">
                              {ANGLE_LABELS[session.angle] || session.angle}
                            </div>
                            <div className="text-sm text-stone-500 dark:text-stone-400">
                              {session.response_count} {t('responses')} · {session.status === 'active' ? t('active') : t('sessionsCompleted')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {session.overall_score && (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              session.overall_score >= 4 ? 'bg-green-500' :
                              session.overall_score >= 3 ? 'bg-cyan-500' :
                              session.overall_score >= 2 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}>
                              {session.overall_score.toFixed(1)}
                            </div>
                          )}
                          <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Disable tool option */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDisableTool('delta')}
                  loading={loading === 'disable-delta'}
                  className="text-red-600 hover:text-red-700"
                >
                  {t('teamsToolDisable')}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-stone-50 dark:bg-stone-800 rounded-xl">
              <div className="text-cyan-400 mb-4 text-4xl font-bold">Δ</div>
              <h3 className="font-semibold text-stone-700 dark:text-stone-300 mb-2">{t('teamsDeltaNotEnabled')}</h3>
              <Button
                onClick={() => handleEnableTool('delta')}
                loading={loading === 'enable-delta'}
              >
                {t('teamsEnableDelta')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">{t('feedbackTitle')}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400">{t('feedbackSubtitle')}</p>
              </div>
            </div>

            {/* Feedback Rules */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-3">{t('feedbackRules')}</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-purple-800 dark:text-purple-300">
                  <span className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">1</span>
                  {t('feedbackRule1')}
                </li>
                <li className="flex items-start gap-2 text-sm text-purple-800 dark:text-purple-300">
                  <span className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">2</span>
                  {t('feedbackRule2')}
                </li>
                <li className="flex items-start gap-2 text-sm text-purple-800 dark:text-purple-300">
                  <span className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">3</span>
                  {t('feedbackRule3')}
                </li>
                <li className="flex items-start gap-2 text-sm text-purple-800 dark:text-purple-300">
                  <span className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">4</span>
                  {t('feedbackRule4')}
                </li>
              </ul>
            </div>

            {/* Coming Soon */}
            <div className="text-center py-8 bg-stone-50 dark:bg-stone-700 rounded-lg">
              <div className="text-4xl mb-3">🚧</div>
              <p className="text-stone-600 dark:text-stone-300 font-medium">{t('feedbackComingSoon')}</p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Feedback tool wordt binnenkort toegevoegd</p>
            </div>
          </div>
        </div>
      )}

      {/* Coach Questions Tab */}
      {activeTab === 'coach' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">{t('coachQuestionsTitle')}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400">{t('coachQuestionsSubtitle')}</p>
              </div>
            </div>

            {/* Example */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-emerald-800 dark:text-emerald-300 italic">{t('coachQuestionsExample')}</p>
            </div>

            {/* Coach Question Generator - Coming Soon */}
            <div className="text-center py-8 bg-stone-50 dark:bg-stone-700 rounded-lg">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-stone-600 dark:text-stone-300 font-medium">{t('feedbackComingSoon')}</p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">AI-powered coaching vragen generator</p>
            </div>
          </div>
        </div>
      )}

      {/* Premium Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-sm font-semibold">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
              </svg>
              Premium Modules
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Obeya Module */}
            <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5 relative overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 text-xs font-medium bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 rounded-full">{t('moduleComingSoon')}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">{t('moduleObeya')}</h4>
              <p className="text-sm text-stone-500 dark:text-stone-400">{t('moduleObeyaDesc')}</p>
            </div>

            {/* Leadership Module */}
            <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5 relative overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 text-xs font-medium bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 rounded-full">{t('moduleComingSoon')}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">{t('moduleLeadership')}</h4>
              <p className="text-sm text-stone-500 dark:text-stone-400">{t('moduleLeadershipDesc')}</p>
            </div>

            {/* Portfolio Module */}
            <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5 relative overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 text-xs font-medium bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 rounded-full">{t('moduleComingSoon')}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">{t('modulePortfolio')}</h4>
              <p className="text-sm text-stone-500 dark:text-stone-400">{t('modulePortfolioDesc')}</p>
            </div>
          </div>

          {/* Contact for access */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6 text-center">
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Interesse in Premium?</h4>
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">Neem contact op voor early access en korting.</p>
            <a href="mailto:expert@pinkpollos.nl?subject=Team Lab Premium Interest">
              <Button variant="secondary" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                {t('contactExpertButton')}
              </Button>
            </a>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Team info */}
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('teamSettings')}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">ID</span>
                <span className="text-stone-700 dark:text-stone-300 font-mono">{team.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Slug</span>
                <span className="text-stone-700 dark:text-stone-300">{team.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">{t('adminCreatedOn')}</span>
                <span className="text-stone-700 dark:text-stone-300">{new Date(team.created_at).toLocaleDateString()}</span>
              </div>
              {team.expected_team_size && (
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">{t('newTeamSize')}</span>
                  <span className="text-stone-700 dark:text-stone-300">{team.expected_team_size}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tool toggles */}
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('teamsToolsEnabled')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-pink-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="font-medium text-stone-900 dark:text-stone-100">Pulse</span>
                </div>
                {team.tools_enabled.includes('pulse') ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDisableTool('pulse')}
                    loading={loading === 'disable-pulse'}
                  >
                    {t('teamsToolDisable')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleEnableTool('pulse')}
                    loading={loading === 'enable-pulse'}
                  >
                    {t('teamsToolEnable')}
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-cyan-500 font-bold">Δ</span>
                  <span className="font-medium text-stone-900 dark:text-stone-100">Delta</span>
                </div>
                {team.tools_enabled.includes('delta') ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDisableTool('delta')}
                    loading={loading === 'disable-delta'}
                  >
                    {t('teamsToolDisable')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleEnableTool('delta')}
                    loading={loading === 'enable-delta'}
                  >
                    {t('teamsToolEnable')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6">
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">{t('teamDeleteTitle')}</h3>
            <p className="text-sm text-red-700 dark:text-red-400 mb-4">{t('teamDeleteMessage')}</p>
            <Button
              variant="secondary"
              onClick={handleDelete}
              loading={loading === 'delete'}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              {t('teamDeleteButton')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Team Maturity Badge Component with Gamification
function TeamMaturityBadge({
  sessionsCount,
  avgScore,
  t
}: {
  sessionsCount: number
  avgScore: number
  t: TranslationFunction
}) {
  // Calculate maturity level based on activity and scores
  let level: 'basic' | 'medium' | 'mature' = 'basic'
  let progress = 0
  let nextLevelSessions = 5

  if (sessionsCount >= 20 && avgScore >= 3.5) {
    level = 'mature'
    progress = 100
    nextLevelSessions = 0
  } else if (sessionsCount >= 5) {
    level = 'medium'
    progress = Math.min(100, ((sessionsCount - 5) / 15) * 100)
    nextLevelSessions = 20 - sessionsCount
  } else {
    level = 'basic'
    progress = (sessionsCount / 5) * 100
    nextLevelSessions = 5 - sessionsCount
  }

  const levels = [
    { key: 'basic', icon: '🌱', label: t('maturityBasic'), isFree: true },
    { key: 'medium', icon: '🌿', label: t('maturityMedium'), isFree: false },
    { key: 'mature', icon: '🌳', label: t('maturityMature'), isFree: false },
  ]

  const currentLevelIndex = levels.findIndex(l => l.key === level)
  const currentConfig = levels[currentLevelIndex]

  const bgColor = level === 'basic'
    ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
    : level === 'medium'
    ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'
    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'

  return (
    <div className="group relative">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full cursor-help ${bgColor}`}>
        <span>{currentConfig.icon}</span>
        {currentConfig.label}
        {!currentConfig.isFree && (
          <span className="ml-0.5 text-[8px] font-bold px-1 py-px bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded">PRO</span>
        )}
      </span>

      {/* Expanded tooltip with all levels */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20">
        <div className="bg-stone-900 dark:bg-stone-950 text-white rounded-xl shadow-xl p-4 w-64">
          <div className="font-semibold mb-3 flex items-center gap-2">
            <span>🏆</span> Team Niveaus
          </div>

          {/* Level indicators */}
          <div className="space-y-2 mb-3">
            {levels.map((lvl, idx) => {
              const isActive = idx === currentLevelIndex
              const isPast = idx < currentLevelIndex
              const isFuture = idx > currentLevelIndex

              return (
                <div
                  key={lvl.key}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    isActive ? 'bg-white/10 ring-1 ring-cyan-400' : ''
                  }`}
                >
                  <span className={`text-lg ${isFuture ? 'opacity-40' : ''}`}>{lvl.icon}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isFuture ? 'opacity-50' : ''}`}>
                      {lvl.label}
                    </div>
                  </div>
                  {isPast && (
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500 text-white rounded font-medium">NU</span>
                  )}
                  {isFuture && !lvl.isFree && (
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress bar */}
          {level !== 'mature' && (
            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                <span>{t('maturityProgress')}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Nog {nextLevelSessions} sessies naar volgend niveau
              </p>
            </div>
          )}

          {level === 'mature' && (
            <div className="text-center py-2 text-green-400 text-xs font-medium">
              ✨ {t('maturityMaxLevel')}
            </div>
          )}

          {/* Upgrade hint */}
          {level !== 'mature' && (
            <a
              href="mailto:expert@pinkpollos.nl?subject=Team Lab Premium"
              className="block mt-2 py-2 text-center text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {t('maturityUpgrade')} →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
