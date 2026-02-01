'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { UnifiedTeam, enableTool, disableTool, deleteTeam, exportPulseData } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'
import { VibeMetrics } from '@/components/admin/vibe-metrics'
import { ShareLinkSection } from '@/components/admin/share-link-section'
import { GettingStartedChecklist } from '@/components/teams/getting-started-checklist'
import { OverallSignal } from '@/components/teams/overall-signal'
import { SessionCompare } from '@/components/ceremonies/session-compare'
import { CoachQuestions } from '@/components/teams/coach-questions'
import { FeedbackTool } from '@/components/teams/feedback-tool'
import type { TeamMetrics, VibeInsight } from '@/domain/metrics/types'
import type { CeremonySessionWithStats, CeremonyLevel } from '@/domain/ceremonies/types'
import { CEREMONY_LEVELS, getAnglesGroupedByLevel } from '@/domain/ceremonies/types'

interface TeamDetailContentProps {
  team: UnifiedTeam
  vibeMetrics?: TeamMetrics | null
  vibeInsights?: VibeInsight[]
  ceremoniesSessions?: CeremonySessionWithStats[]
}

type TabType = 'vibe' | 'ceremonies' | 'feedback' | 'coach' | 'modules' | 'settings'

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

export function TeamDetailContent({ team, vibeMetrics, vibeInsights = [], ceremoniesSessions = [] }: TeamDetailContentProps) {
  const t = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial tab from URL or default based on enabled tools
  const getInitialTab = (): TabType => {
    const urlTab = searchParams.get('tab') as TabType | null
    const validTabs = ['vibe', 'ceremonies', 'feedback', 'coach', 'modules', 'settings']
    if (urlTab && validTabs.includes(urlTab)) {
      // Only use URL tab if the tool is enabled (or it's a general tab)
      if (['settings', 'feedback', 'coach', 'modules'].includes(urlTab)) return urlTab
      if (team.tools_enabled.includes(urlTab as 'vibe' | 'ceremonies')) return urlTab
    }
    // Default: first enabled tool or settings
    return team.tools_enabled.includes('vibe') ? 'vibe' :
           team.tools_enabled.includes('ceremonies') ? 'ceremonies' : 'settings'
  }

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab)
  const [loading, setLoading] = useState<string | null>(null)
  const [showCompare, setShowCompare] = useState(false)

  // Update tab when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlTab = searchParams.get('tab') as TabType | null
    const validTabs = ['vibe', 'ceremonies', 'feedback', 'coach', 'modules', 'settings']
    if (urlTab && validTabs.includes(urlTab)) {
      if (['settings', 'feedback', 'coach', 'modules'].includes(urlTab) || team.tools_enabled.includes(urlTab as 'vibe' | 'ceremonies')) {
        setActiveTab(urlTab)
      }
    }
  }, [searchParams, team.tools_enabled])

  const handleEnableTool = async (tool: 'vibe' | 'ceremonies') => {
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

  const handleDisableTool = async (tool: 'vibe' | 'ceremonies') => {
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

  const handleExportCSV = async () => {
    setLoading('export')
    const result = await exportPulseData(team.id)
    setLoading(null)

    if (!result.success || !result.data || result.data.length === 0) {
      alert(result.error || t('exportNoData'))
      return
    }

    // Generate CSV content
    const headers = ['Date', 'Mood', 'Alias', 'Comment']
    const rows = result.data.map(row => [
      row.date,
      row.mood.toString(),
      row.alias || '',
      row.comment ? `"${row.comment.replace(/"/g, '""')}"` : '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pulse-${team.slug}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }


  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 1: TEAM SIGNAL BAR (with team name)
          Primary state indicator - visually dominant
          ═══════════════════════════════════════════════════════════════════ */}
      <OverallSignal
        teamName={team.name}
        needsAttention={team.needs_attention}
        vibeScore={team.vibe?.average_score || null}
        ceremoniesScore={team.ceremonies?.average_score || null}
        vibeParticipation={(() => {
          const effectiveSize = team.expected_team_size || team.vibe?.participant_count || 1
          const todayCount = team.vibe?.today_entries || 0
          return effectiveSize > 0 ? Math.round((todayCount / effectiveSize) * 100) : 0
        })()}
        ceremoniesSessions={team.ceremonies?.total_sessions || 0}
        ceremonyLevel={team.ceremonies?.level as CeremonyLevel | undefined}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 2: SECTION CONTEXT
          Elaborate explanation of what this area does
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-4 sm:p-5">
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          {activeTab === 'vibe' && t('vibeExplanation')}
          {activeTab === 'ceremonies' && t('ceremoniesExplanation')}
          {activeTab === 'feedback' && t('feedbackExplanation')}
          {activeTab === 'coach' && t('coachExplanation')}
          {activeTab === 'settings' && t('settingsExplanation')}
          {activeTab === 'modules' && t('modulesExplanation')}
          {!activeTab && t('teamDetailContext')}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 3: SIGNAL CONFIDENCE & ONBOARDING
          Data maturity, baseline status, getting started guidance
          ═══════════════════════════════════════════════════════════════════ */}
      <GettingStartedChecklist
        teamId={team.id}
        teamSlug={team.slug}
        hasPulseEntries={(team.vibe?.participant_count || 0) > 0}
        hasCeremonySessions={(team.ceremonies?.total_sessions || 0) > 0}
        hasClosedSessions={(team.ceremonies?.closed_sessions || 0) > 0}
      />

      {/* Section content (navigation is in the global header) */}
      {activeTab === 'vibe' && (
        <div className="space-y-6">
          {team.vibe ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left column: Metrics */}
              <div className="space-y-6">
                {vibeMetrics && (
                  <VibeMetrics metrics={vibeMetrics} insights={vibeInsights} />
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
                      const effectiveSize = team.expected_team_size || team.vibe.participant_count || 1
                      const todayCount = team.vibe.today_entries
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
                        {team.vibe.participant_count}
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

              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-stone-50 dark:bg-stone-800 rounded-xl">
              <div className="text-stone-400 dark:text-stone-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-700 dark:text-stone-300 mb-2">{t('teamsVibeNotEnabled')}</h3>
              <Button
                onClick={() => handleEnableTool('vibe')}
                loading={loading === 'enable-vibe'}
              >
                {t('teamsEnableVibe')}
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ceremonies' && (
        <div className="space-y-6">
          {team.ceremonies ? (
            <>
              {/* Simple Start Session Section */}
              {(() => {
                const teamLevel = (team.ceremonies?.level as CeremonyLevel) || 'shu'
                const anglesGrouped = getAnglesGroupedByLevel()
                const currentLevelInfo = CEREMONY_LEVELS.find(l => l.id === teamLevel)!
                const nextLevel = teamLevel === 'shu' ? 'ha' : teamLevel === 'ha' ? 'ri' : null
                const nextLevelInfo = nextLevel ? CEREMONY_LEVELS.find(l => l.id === nextLevel) : null

                const levelColors = {
                  shu: { accent: 'bg-amber-500 hover:bg-amber-600', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
                  ha: { accent: 'bg-cyan-500 hover:bg-cyan-600', text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800' },
                  ri: { accent: 'bg-purple-500 hover:bg-purple-600', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
                }

                const getAngleLabel = (angleId: string) => {
                  const labelMap: Record<string, string> = {
                    scrum: t('angleScrum'), flow: t('angleFlow'), ownership: t('angleOwnership'),
                    collaboration: t('angleCollaboration'), technical_excellence: t('angleTechnicalExcellence'),
                    refinement: t('angleRefinement'), planning: t('anglePlanning'), retro: t('angleRetro'), demo: t('angleDemo'),
                  }
                  return labelMap[angleId] || angleId
                }

                const unlockRequirements = {
                  ha: 'Run 3 sessions in 30 days with a team score of 3.2+ and 60%+ participation',
                  ri: 'Complete 6 sessions across 3 different types, with scores above 3.5 and 70%+ participation',
                }

                return (
                  <div className="space-y-4">
                    {/* Current Level - Start Session */}
                    <div className={`rounded-xl border-2 ${levelColors[teamLevel].border} ${levelColors[teamLevel].bg} p-5`}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`text-3xl font-bold ${levelColors[teamLevel].text}`}>{currentLevelInfo.kanji}</span>
                        <div>
                          <div className={`font-bold text-lg ${levelColors[teamLevel].text}`}>{currentLevelInfo.label}</div>
                          <div className="text-sm text-stone-500 dark:text-stone-400">{currentLevelInfo.subtitle}</div>
                        </div>
                      </div>

                      <div className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">{t('startNewSession')}</div>
                      <div className="flex flex-wrap gap-2">
                        {anglesGrouped[teamLevel].map(angle => (
                          <Link key={angle.id} href={`/teams/${team.id}/ceremonies/new?angle=${angle.id}`}>
                            <button className={`px-4 py-2.5 rounded-lg text-white font-medium transition-colors ${levelColors[teamLevel].accent}`}>
                              {getAngleLabel(angle.id)}
                            </button>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Next Level Preview */}
                    {nextLevel && nextLevelInfo && (
                      <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl font-bold text-stone-400 dark:text-stone-500">{nextLevelInfo.kanji}</span>
                          <span className="font-medium text-stone-400 dark:text-stone-500">{nextLevelInfo.label}</span>
                          <span className="text-stone-400 dark:text-stone-500">🔒</span>
                        </div>
                        <div className="text-sm text-stone-500 dark:text-stone-400 mb-3">
                          <strong>Unlock:</strong> {unlockRequirements[nextLevel]}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {anglesGrouped[nextLevel].map(angle => (
                            <span key={angle.id} className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 text-sm">
                              {getAngleLabel(angle.id)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats & Compare */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
                        <span><strong>{team.ceremonies.total_sessions}</strong> sessions</span>
                        <span><strong>{team.ceremonies.active_sessions}</strong> active</span>
                        {team.ceremonies.average_score && (
                          <span>Avg: <strong>{team.ceremonies.average_score.toFixed(1)}</strong></span>
                        )}
                      </div>
                      {(team.ceremonies?.closed_sessions || 0) >= 2 && (
                        <Button variant="secondary" size="sm" onClick={() => setShowCompare(true)}>
                          {t('ceremoniesCompare')}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Sessions list */}
              {ceremoniesSessions.length > 0 && (
                <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-700">
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">{t('sessions')}</h3>
                  </div>
                  <div className="divide-y divide-stone-100 dark:divide-stone-700">
                    {ceremoniesSessions.map(session => (
                      <Link
                        key={session.id}
                        href={`/ceremonies/session/${session.id}`}
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
                  onClick={() => handleDisableTool('ceremonies')}
                  loading={loading === 'disable-ceremonies'}
                  className="text-red-600 hover:text-red-700"
                >
                  {t('teamsToolDisable')}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-stone-50 dark:bg-stone-800 rounded-xl">
              <div className="text-cyan-400 mb-4 text-4xl font-bold">Δ</div>
              <h3 className="font-semibold text-stone-700 dark:text-stone-300 mb-2">{t('teamsCeremoniesNotEnabled')}</h3>
              <Button
                onClick={() => handleEnableTool('ceremonies')}
                loading={loading === 'enable-ceremonies'}
              >
                {t('teamsEnableCeremonies')}
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

            <FeedbackTool teamId={team.id} teamName={team.name} />
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

            {/* Coach Question Generator */}
            <CoachQuestions
              pulseScore={team.vibe?.average_score || null}
              pulseParticipation={(() => {
                const effectiveSize = team.expected_team_size || team.vibe?.participant_count || 1
                const todayCount = team.vibe?.today_entries || 0
                return effectiveSize > 0 ? Math.round((todayCount / effectiveSize) * 100) : 0
              })()}
              deltaTensions={[]}
              teamName={team.name}
            />
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
            <a href="mailto:expert@pinkpollos.nl?subject=Pulse Premium Interest">
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

          {/* Data Export */}
          {team.tools_enabled.includes('vibe') && (
            <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('exportData')}</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCSV}
                loading={loading === 'export'}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('exportCSV')}
              </Button>
            </div>
          )}

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
                  <span className="font-medium text-stone-900 dark:text-stone-100">Vibe</span>
                </div>
                {team.tools_enabled.includes('vibe') ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDisableTool('vibe')}
                    loading={loading === 'disable-vibe'}
                  >
                    {t('teamsToolDisable')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleEnableTool('vibe')}
                    loading={loading === 'enable-vibe'}
                  >
                    {t('teamsToolEnable')}
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-cyan-500 font-bold">Δ</span>
                  <span className="font-medium text-stone-900 dark:text-stone-100">Ceremonies</span>
                </div>
                {team.tools_enabled.includes('ceremonies') ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDisableTool('ceremonies')}
                    loading={loading === 'disable-ceremonies'}
                  >
                    {t('teamsToolDisable')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleEnableTool('ceremonies')}
                    loading={loading === 'enable-ceremonies'}
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

      {/* Session Compare Modal */}
      {showCompare && (
        <SessionCompare
          teamId={team.id}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  )
}
