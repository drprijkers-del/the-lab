'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { UnifiedTeam, enableTool, disableTool, deleteTeam, exportPulseData, getShareLink, deactivateShareLink } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'
import { GettingStartedChecklist } from '@/components/teams/getting-started-checklist'
import { OverallSignal } from '@/components/teams/overall-signal'
import { CoachQuestions } from '@/components/teams/coach-questions'
import { FeedbackTool } from '@/components/teams/feedback-tool'
import { VibeMetrics } from '@/components/admin/vibe-metrics'
import type { TeamMetrics, VibeInsight } from '@/domain/metrics/types'
import type { CeremonySessionWithStats, CeremonyLevel } from '@/domain/ceremonies/types'

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
    // Always respect URL tab - content handles disabled state
    if (urlTab && validTabs.includes(urlTab)) {
      return urlTab
    }
    // Default: first enabled tool, or vibe, or settings
    return team.tools_enabled.includes('vibe') ? 'vibe' :
           team.tools_enabled.includes('ceremonies') ? 'ceremonies' : 'vibe'
  }

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab)
  const [loading, setLoading] = useState<string | null>(null)
  const [showVibeAdvanced, setShowVibeAdvanced] = useState(false)
  const [sessionsLevelTab, setSessionsLevelTab] = useState<CeremonyLevel>('shu')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)

  // Update tab when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlTab = searchParams.get('tab') as TabType | null
    const validTabs = ['vibe', 'ceremonies', 'feedback', 'coach', 'modules', 'settings']
    // Always respect URL tab - content handles disabled state
    if (urlTab && validTabs.includes(urlTab)) {
      setActiveTab(urlTab)
    }
  }, [searchParams])

  // Fetch or create share link for Vibe
  const handleGetShareLink = async () => {
    setShareLoading(true)
    try {
      const result = await getShareLink(team.id)
      if (result) {
        setShareUrl(result.url)
      }
    } catch (error) {
      console.error('Failed to get share link:', error)
    }
    setShareLoading(false)
  }

  // Auto-fetch share link when vibe is enabled (on initial load)
  useEffect(() => {
    if (team.vibe) {
      handleGetShareLink()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id])

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

    // Reset share URL when vibe is disabled
    if (tool === 'vibe') {
      setShareUrl(null)
      setShowVibeAdvanced(false)
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

  // Calculate vibe message for display in OverallSignal (only when on Vibe tab)
  const getVibeContext = () => {
    if (!team.vibe) return { message: null, suggestion: null }

    const score = team.vibe.average_score
    const hasEnoughData = vibeMetrics?.hasEnoughData ?? false

    if (!hasEnoughData || !score) {
      return { message: t('vibeNotEnoughData'), suggestion: t('vibeShareLinkSuggestion') }
    } else if (score >= 4) {
      return { message: t('vibeGreat'), suggestion: t('vibeGreatSuggestion') }
    } else if (score >= 3.2) {
      return { message: t('vibeGood'), suggestion: t('vibeGoodSuggestion') }
    } else if (score >= 2.5) {
      return { message: t('vibeAttention'), suggestion: t('vibeAttentionSuggestion') }
    } else {
      return { message: t('vibeConcern'), suggestion: t('vibeConcernSuggestion') }
    }
  }

  const vibeContext = activeTab === 'vibe' ? getVibeContext() : { message: null, suggestion: null }

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
        vibeMessage={vibeContext.message}
        vibeSuggestion={vibeContext.suggestion}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 2: SECTION CONTEXT
          Elaborate explanation of what this area does
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
        <div className="flex items-start gap-3">
          {/* Icon per tab */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            activeTab === 'vibe' ? 'bg-pink-100 dark:bg-pink-900/30' :
            activeTab === 'ceremonies' ? 'bg-cyan-100 dark:bg-cyan-900/30' :
            activeTab === 'feedback' ? 'bg-purple-100 dark:bg-purple-900/30' :
            activeTab === 'coach' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
            'bg-stone-100 dark:bg-stone-700'
          }`}>
            {activeTab === 'vibe' && <span className="text-pink-500 text-lg">♥</span>}
            {activeTab === 'ceremonies' && <span className="text-cyan-500 font-bold text-lg">Δ</span>}
            {activeTab === 'feedback' && (
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )}
            {activeTab === 'coach' && (
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )}
            {(activeTab === 'settings' || activeTab === 'modules' || !activeTab) && (
              <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
              {activeTab === 'vibe' && t('vibeTitle')}
              {activeTab === 'ceremonies' && t('ceremoniesTitle')}
              {activeTab === 'feedback' && t('feedbackTitle')}
              {activeTab === 'coach' && t('coachQuestionsTitle')}
              {activeTab === 'settings' && t('teamSettings')}
              {activeTab === 'modules' && 'Premium Modules'}
              {!activeTab && t('teamDetailContext')}
            </h3>
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
        </div>

        {/* Shu-Ha-Ri explanation - only on ceremonies tab */}
        {activeTab === 'ceremonies' && team.ceremonies && (
          <div className="mt-5 pt-5 border-t border-stone-100 dark:border-stone-700">
            <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">{t('shuHaRiTitle')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Shu */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">守</span>
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Shu</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">{t('shuDescription')}</p>
              </div>
              {/* Ha */}
              <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">破</span>
                  <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">Ha</span>
                  {(team.ceremonies?.level || 'shu') === 'shu' && <span className="text-xs">🔒</span>}
                </div>
                <p className="text-xs text-cyan-600 dark:text-cyan-400">{t('haDescription')}</p>
                {(team.ceremonies?.level || 'shu') === 'shu' && (
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 leading-tight"><strong>To unlock:</strong> {t('unlockHaCriteria')}</p>
                )}
              </div>
              {/* Ri */}
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">離</span>
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Ri</span>
                  {(team.ceremonies?.level || 'shu') !== 'ri' && <span className="text-xs">🔒</span>}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">{t('riDescription')}</p>
                {(team.ceremonies?.level || 'shu') === 'ha' && (
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 leading-tight"><strong>To unlock:</strong> {t('unlockRiCriteria')}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 3: SIGNAL CONFIDENCE & ONBOARDING
          Data maturity, baseline status, getting started guidance
          ═══════════════════════════════════════════════════════════════════ */}
      <GettingStartedChecklist
        teamId={team.id}
        teamSlug={team.slug}
        activeTab={activeTab}
        hasPulseEntries={(team.vibe?.participant_count || 0) > 0}
        hasCeremonySessions={(team.ceremonies?.total_sessions || 0) > 0}
        hasClosedSessions={(team.ceremonies?.closed_sessions || 0) > 0}
      />

      {/* Section content (navigation is in the global header) */}
      {activeTab === 'vibe' && (
        <div className="space-y-6">
          {team.vibe ? (
            <>
              {/* Share Link Section - right under intro */}
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    {shareUrl ? (
                      <>
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('shareReady')}</div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 truncate">{shareUrl}</div>
                      </>
                    ) : shareLoading ? (
                      <>
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('shareLoading')}</div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">{t('shareLoadingDetail')}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('shareNotCreated')}</div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">{t('shareNotCreatedDetail')}</div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {shareUrl ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(shareUrl)
                          }}
                        >
                          {t('shareCopy')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(shareUrl, '_blank')}
                        >
                          {t('shareOpen')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowVibeAdvanced(!showVibeAdvanced)}
                          className={showVibeAdvanced ? 'bg-stone-100 dark:bg-stone-700' : ''}
                        >
                          {t('shareAdvanced')}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleGetShareLink}
                        loading={shareLoading}
                        size="sm"
                      >
                        {t('shareCreate')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Advanced panel */}
                {showVibeAdvanced && (
                  <div className="border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-4 space-y-4">
                    {/* Reset Link */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('shareResetTitle')}</div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('shareResetInfo')}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            if (!confirm(t('shareResetConfirm'))) return
                            setShareUrl(null)
                            await handleGetShareLink()
                          }}
                          loading={shareLoading}
                          className="text-amber-600 hover:text-amber-700 mt-2"
                        >
                          {t('shareResetButton')}
                        </Button>
                      </div>
                    </div>

                    {/* Deactivate Link (kill switch) */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('shareDeactivateTitle')}</div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('shareDeactivateInfo')}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            if (!confirm(t('shareDeactivateConfirm'))) return
                            setShareLoading(true)
                            const result = await deactivateShareLink(team.id)
                            if (result.success) {
                              setShareUrl(null)
                              setShowVibeAdvanced(false)
                            } else {
                              alert(result.error || 'Could not deactivate link')
                            }
                            setShareLoading(false)
                          }}
                          loading={shareLoading}
                          className="text-red-600 hover:text-red-700 mt-2"
                        >
                          {t('shareDeactivateButton')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Vibe Metrics - mood data dashboard */}
              {vibeMetrics && (
                <VibeMetrics metrics={vibeMetrics} insights={vibeInsights || []} />
              )}
            </>
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
              {/* Stats + New Session Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
                  <span><strong>{team.ceremonies.total_sessions}</strong> sessions</span>
                  <span><strong>{team.ceremonies.active_sessions}</strong> active</span>
                  {team.ceremonies.average_score && (
                    <span>Avg: <strong>{team.ceremonies.average_score.toFixed(1)}</strong></span>
                  )}
                </div>
                <Link
                  href={`/teams/${team.id}/ceremonies/new`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('newSession')}
                </Link>
              </div>

              {/* Sessions with Level Tabs */}
              {(() => {
                const currentTeamLevel = (team.ceremonies?.level as CeremonyLevel) || 'shu'
                const levelOrder: CeremonyLevel[] = ['shu', 'ha', 'ri']
                const currentLevelIndex = levelOrder.indexOf(currentTeamLevel)

                // Filter sessions by their stored level (defaults to 'shu' for old sessions)
                const filteredSessions = ceremoniesSessions.filter(s => (s.level || 'shu') === sessionsLevelTab)

                const levelTabs: { id: CeremonyLevel; kanji: string; label: string; locked: boolean; color: string }[] = [
                  { id: 'shu', kanji: '守', label: 'Shu', locked: false, color: 'amber' },
                  { id: 'ha', kanji: '破', label: 'Ha', locked: currentLevelIndex < 1, color: 'cyan' },
                  { id: 'ri', kanji: '離', label: 'Ri', locked: currentLevelIndex < 2, color: 'purple' },
                ]

                return (
                  <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                    {/* Level Tabs */}
                    <div className="flex border-b border-stone-200 dark:border-stone-700">
                      {levelTabs.map(tab => {
                        const isActive = sessionsLevelTab === tab.id
                        const colorClasses = {
                          amber: isActive ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' : '',
                          cyan: isActive ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' : '',
                          purple: isActive ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' : '',
                        }
                        return (
                          <button
                            key={tab.id}
                            onClick={() => !tab.locked && setSessionsLevelTab(tab.id)}
                            disabled={tab.locked}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                              isActive
                                ? colorClasses[tab.color as keyof typeof colorClasses]
                                : tab.locked
                                  ? 'border-transparent text-stone-300 dark:text-stone-600 cursor-not-allowed'
                                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                            }`}
                          >
                            <span className="font-bold">{tab.kanji}</span>
                            <span>{tab.label}</span>
                            {tab.locked && <span className="text-xs">🔒</span>}
                          </button>
                        )
                      })}
                    </div>

                    {/* Sessions for selected level */}
                    {filteredSessions.length > 0 ? (
                      <div className="divide-y divide-stone-100 dark:divide-stone-700">
                        {filteredSessions.map(session => (
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
                    ) : (
                      <div className="p-8 text-center text-stone-400 dark:text-stone-500">
                        <p className="text-sm">{t('noSessionsAtLevel')}</p>
                      </div>
                    )}
                  </div>
                )
              })()}

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

    </div>
  )
}
