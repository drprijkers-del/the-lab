'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { UnifiedTeam, enableTool, disableTool, deleteTeam, exportPulseData, getShareLink, deactivateShareLink, updateTeam } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'
import { OverallSignal } from '@/components/teams/overall-signal'
import { CoachQuestions } from '@/components/teams/coach-questions'
// BillingTab removed — billing is now at /account/billing
import { ProGate } from '@/components/teams/pro-gate'
import { FeedbackTool } from '@/components/teams/feedback-tool'
import { VibeMetrics } from '@/components/admin/vibe-metrics'
import { RadarChart, type RadarAxis } from '@/components/ui/radar-chart'
import type { TeamMetrics, VibeInsight } from '@/domain/metrics/types'
import type { WowSessionWithStats, WowLevel } from '@/domain/wow/types'
import type { PublicWowStats } from '@/domain/metrics/public-actions'
import type { SubscriptionTier } from '@/domain/billing/tiers'
import { AiCoach } from '@/components/teams/ai-coach'

interface TeamDetailContentProps {
  team: UnifiedTeam
  vibeMetrics?: TeamMetrics | null
  vibeInsights?: VibeInsight[]
  wowSessions?: WowSessionWithStats[]
  wowStats?: PublicWowStats | null
  subscriptionTier?: SubscriptionTier
}

type TabType = 'home' | 'vibe' | 'wow' | 'feedback' | 'coach' | 'settings'

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
  obeya: 'Obeya',
  dependencies: 'Dependencies',
  psychological_safety: 'Psych Safety',
  devops: 'DevOps',
  stakeholder: 'Stakeholders',
  leadership: 'Leadership',
}

export function TeamDetailContent({ team, vibeMetrics, vibeInsights = [], wowSessions = [], wowStats, subscriptionTier = 'free' }: TeamDetailContentProps) {
  const t = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial tab from URL or default to home dashboard
  const getInitialTab = (): TabType => {
    const urlTab = searchParams.get('tab') as TabType | null
    const validTabs = ['home', 'vibe', 'wow', 'feedback', 'coach', 'settings']
    // Always respect URL tab - content handles disabled state
    if (urlTab && validTabs.includes(urlTab)) {
      return urlTab
    }
    // Default: show home dashboard
    return 'home'
  }

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab)
  const [loading, setLoading] = useState<string | null>(null)
  const [showVibeAdvanced, setShowVibeAdvanced] = useState(false)
  const [sessionsLevelTab, setSessionsLevelTab] = useState<WowLevel>('shu')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  const [resultsCopied, setResultsCopied] = useState(false)

  // Update tab when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlTab = searchParams.get('tab') as TabType | null
    const validTabs = ['home', 'vibe', 'wow', 'feedback', 'coach', 'settings']
    // Always respect URL tab - content handles disabled state
    if (urlTab && validTabs.includes(urlTab)) {
      setActiveTab(urlTab)
    } else if (!urlTab) {
      // No tab param = show home
      setActiveTab('home')
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

  const handleEnableTool = async (tool: 'vibe' | 'wow') => {
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

  const handleDisableTool = async (tool: 'vibe' | 'wow') => {
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

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading('save-settings')
    setSettingsSuccess(false)

    const formData = new FormData(e.currentTarget)
    const result = await updateTeam(team.id, formData)

    setLoading(null)

    if (!result.success) {
      alert(result.error || 'Er ging iets mis bij het opslaan')
      return
    }

    setSettingsSuccess(true)
    router.refresh()
    setTimeout(() => setSettingsSuccess(false), 2000)
  }

  // Calculate vibe message for display in OverallSignal (only when on Vibe tab)
  const getVibeContext = () => {
    if (!team.vibe) return { message: null, suggestion: null, wowHint: null }

    const score = team.vibe.average_score
    const hasEnoughData = vibeMetrics?.hasEnoughData ?? false
    const hasWow = team.tools_enabled.includes('wow')

    if (!hasEnoughData || !score) {
      return { message: t('vibeNotEnoughData'), suggestion: t('vibeShareLinkSuggestion'), wowHint: null }
    } else if (score >= 4) {
      return { message: t('vibeGreat'), suggestion: t('vibeGreatSuggestion'), wowHint: null }
    } else if (score >= 3.2) {
      return { message: t('vibeGood'), suggestion: t('vibeGoodSuggestion'), wowHint: null }
    } else if (score >= 2.5) {
      // Show wow hint when attention needed and wow is enabled
      return {
        message: t('vibeAttention'),
        suggestion: t('vibeAttentionSuggestion'),
        wowHint: hasWow ? t('vibeWowHint') : null
      }
    } else {
      // Show wow hint when vibe is low and wow is enabled
      return {
        message: t('vibeConcern'),
        suggestion: t('vibeConcernSuggestion'),
        wowHint: hasWow ? t('vibeWowHint') : null
      }
    }
  }

  const vibeContext = activeTab === 'vibe' ? getVibeContext() : { message: null, suggestion: null, wowHint: null }

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 1: TEAM SIGNAL BAR (with team name)
          Primary state indicator - visually dominant
          ═══════════════════════════════════════════════════════════════════ */}
      <OverallSignal
        teamId={team.id}
        teamName={team.name}
        needsAttention={team.needs_attention}
        vibeScore={vibeMetrics?.weekVibe?.value ?? team.vibe?.average_score ?? null}
        wowScore={wowStats?.averageScore ?? team.wow?.average_score ?? null}
        vibeParticipation={(() => {
          const effectiveSize = team.expected_team_size || team.vibe?.participant_count || 1
          const todayCount = team.vibe?.today_entries || 0
          return effectiveSize > 0 ? Math.round((todayCount / effectiveSize) * 100) : 0
        })()}
        wowSessions={team.wow?.total_sessions || 0}
        wowLevel={team.wow?.level as WowLevel | undefined}
        vibeMessage={vibeContext.message}
        vibeSuggestion={vibeContext.suggestion}
        vibeWowHint={vibeContext.wowHint}
      />

      {/* Pulse Labs branding */}
      <div className="flex items-center justify-center gap-2 -mt-2">
        <svg className="w-7 h-7" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="url(#plRipple)" strokeWidth="2" fill="none" opacity="0.4" />
          <circle cx="32" cy="32" r="20" stroke="url(#plRipple)" strokeWidth="2.5" fill="none" opacity="0.6" />
          <circle cx="32" cy="32" r="12" stroke="url(#plRipple)" strokeWidth="3" fill="none" opacity="0.85" />
          <circle cx="32" cy="32" r="5" fill="url(#plDrop)" />
          <defs>
            <linearGradient id="plDrop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="plRipple" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex flex-col leading-none">
          <span className="font-bold text-sm text-stone-900 dark:text-stone-200">Pulse</span>
          <span className="text-[7px] font-medium text-stone-400 dark:text-stone-400 uppercase tracking-widest -mt-0.5">Labs</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 2: SECTION CONTEXT
          Elaborate explanation of what this area does
          Hidden on home/dashboard tab - the cards are self-explanatory
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab !== 'home' && (
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
        <div className="flex items-start gap-3">
          {/* Icon per tab */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            activeTab === 'vibe' ? 'bg-pink-100 dark:bg-pink-900/30' :
            activeTab === 'wow' ? 'bg-cyan-100 dark:bg-cyan-900/30' :
            activeTab === 'feedback' ? 'bg-purple-100 dark:bg-purple-900/30' :
            activeTab === 'coach' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
            'bg-stone-100 dark:bg-stone-700'
          }`}>
            {activeTab === 'vibe' && (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500" />
              </svg>
            )}
            {activeTab === 'wow' && <span className="text-cyan-500 font-bold text-lg">Δ</span>}
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
            {(activeTab === 'settings' || !activeTab) && (
              <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
              {activeTab === 'vibe' && t('vibeTitle')}
              {activeTab === 'wow' && t('wowTitle')}
              {activeTab === 'feedback' && t('feedbackTitle')}
              {activeTab === 'coach' && (
                (subscriptionTier === 'agile_coach' || subscriptionTier === 'transition_coach')
                  ? t('aiCoachTitle')
                  : t('coachQuestionsTitle')
              )}
              {activeTab === 'settings' && t('teamSettings')}
              {!activeTab && t('teamDetailContext')}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {activeTab === 'vibe' && t('vibeExplanation')}
              {activeTab === 'wow' && t('wowExplanation')}
              {activeTab === 'feedback' && t('feedbackExplanation')}
              {activeTab === 'coach' && t('coachExplanation')}
              {activeTab === 'settings' && t('settingsExplanation')}
              {!activeTab && t('teamDetailContext')}
            </p>
            {/* Vibe steps - clarify what this signal means */}
            {activeTab === 'vibe' && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{t('vibeStep1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{t('vibeStep2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{t('vibeStep3')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{t('vibeStep4')}</span>
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500 italic pt-1">
                  {t('vibeTrustNote')}
                </p>
              </div>
            )}
            {/* Way of Work steps - exploration focus */}
            {activeTab === 'wow' && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{t('wowStep1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{t('wowStep2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{t('wowStep3')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{t('wowStep4')}</span>
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500 italic pt-1">
                  {t('wowGuidance')}
                </p>
              </div>
            )}
            {/* Feedback framing - listening instrument */}
            {activeTab === 'feedback' && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-stone-400 dark:text-stone-500 italic">
                  {t('feedbackFraming')}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  {t('feedbackGuidance')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Shu-Ha-Ri progression - only on wow tab */}
        {activeTab === 'wow' && (() => {
          const currentLevel = team.wow?.level || 'shu'
          const levelIndex = currentLevel === 'shu' ? 0 : currentLevel === 'ha' ? 1 : 2
          return (
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">{t('shuHaRiTitle')}</h4>
            </div>
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">{t('levelExplainer')}</p>

            {/* Level progression steps */}
            <div className="space-y-2">
              {/* Shu */}
              <div className={`p-2.5 rounded-lg border ${currentLevel === 'shu' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800' : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-amber-600 dark:text-amber-400">守</span>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{t('shuLabel')}</span>
                  <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">— {t('shuDescription')}</span>
                  {currentLevel === 'shu' && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded">{t('currentLevel')}</span>
                  )}
                  {levelIndex > 0 && (
                    <span className="ml-auto text-green-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow + unlock requirements for Ha */}
              {currentLevel === 'shu' && (
                <div className="pl-4 py-1">
                  <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 mb-1">{t('unlockHaTitle')}:</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500">{t('unlockHaCriteria')}</p>
                </div>
              )}

              {/* Ha */}
              <div className={`p-2.5 rounded-lg border ${currentLevel === 'ha' ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-700 ring-1 ring-cyan-200 dark:ring-cyan-800' : levelIndex > 1 ? 'bg-cyan-50/50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 opacity-60'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold ${levelIndex >= 1 ? 'text-cyan-600 dark:text-cyan-400' : 'text-stone-400 dark:text-stone-500'}`}>破</span>
                  <span className={`text-xs font-semibold ${levelIndex >= 1 ? 'text-cyan-700 dark:text-cyan-300' : 'text-stone-500 dark:text-stone-400'}`}>{t('haLabel')}</span>
                  <span className={`text-[10px] ${levelIndex >= 1 ? 'text-cyan-600/70 dark:text-cyan-400/70' : 'text-stone-400 dark:text-stone-500'}`}>— {t('haDescription')}</span>
                  {currentLevel === 'ha' && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-cyan-200 dark:bg-cyan-800 text-cyan-700 dark:text-cyan-300 rounded">{t('currentLevel')}</span>
                  )}
                  {levelIndex > 1 && (
                    <span className="ml-auto text-green-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </span>
                  )}
                  {levelIndex < 1 && (
                    <span className="ml-auto">
                      <svg className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow + unlock requirements for Ri */}
              {currentLevel === 'ha' && (
                <div className="pl-4 py-1">
                  <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 mb-1">{t('unlockRiTitle')}:</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500">{t('unlockRiCriteria')}</p>
                </div>
              )}

              {/* Ri */}
              <div className={`p-2.5 rounded-lg border ${currentLevel === 'ri' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 ring-1 ring-purple-200 dark:ring-purple-800' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 opacity-60'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold ${currentLevel === 'ri' ? 'text-purple-600 dark:text-purple-400' : 'text-stone-400 dark:text-stone-500'}`}>離</span>
                  <span className={`text-xs font-semibold ${currentLevel === 'ri' ? 'text-purple-700 dark:text-purple-300' : 'text-stone-500 dark:text-stone-400'}`}>{t('riLabel')}</span>
                  <span className={`text-[10px] ${currentLevel === 'ri' ? 'text-purple-600/70 dark:text-purple-400/70' : 'text-stone-400 dark:text-stone-500'}`}>— {t('riDescription')}</span>
                  {currentLevel === 'ri' && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded">{t('currentLevel')}</span>
                  )}
                  {currentLevel !== 'ri' && (
                    <span className="ml-auto">
                      <svg className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          )
        })()}
      </div>
      )}

      {/* HOME DASHBOARD - Overview with tool cards */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Mobile navigation hint */}
          <div className="sm:hidden flex items-center gap-2 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
            <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-xs text-stone-500 dark:text-stone-400">{t('dashboardNavHint')}</span>
          </div>

          {/* Tool Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Vibe Card */}
            <button
              onClick={() => router.push(`/teams/${team.id}?tab=vibe`)}
              className="h-full bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 text-left hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-md transition-all group"
            >
              <div className="h-full flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {/* Vibe pulse/wave logo */}
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M2 12h3l2-6 3 12 3-8 2 4h7"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-cyan-600 dark:text-cyan-400"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100">Vibe</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('vibeCardDesc')}</p>
                  <div className="mt-auto pt-2">
                    {vibeMetrics?.weekVibe?.value !== null && vibeMetrics?.weekVibe?.value !== undefined ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          vibeMetrics.weekVibe.value >= 4 ? 'text-green-600' :
                          vibeMetrics.weekVibe.value >= 3 ? 'text-cyan-600' :
                          vibeMetrics.weekVibe.value >= 2 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {vibeMetrics.weekVibe.value.toFixed(1)}
                        </span>
                        <span className="text-xs text-stone-400">{t('teamHealth')}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400">&nbsp;</span>
                    )}
                  </div>
                </div>
                <svg className="w-5 h-5 text-stone-300 dark:text-stone-600 group-hover:text-cyan-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Way of Work Card */}
            <button
              onClick={() => router.push(`/teams/${team.id}?tab=wow`)}
              className="h-full bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 text-left hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all group"
            >
              <div className="h-full flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">Δ</span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100">Way of Work</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('wowCardDesc')}</p>
                  <div className="mt-auto pt-2">
                    {team.wow && (team.wow.total_sessions || 0) > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {team.wow.closed_sessions || 0}
                        </span>
                        <span className="text-xs text-stone-400">{t('sessionsCompleted')}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400">&nbsp;</span>
                    )}
                  </div>
                </div>
                <svg className="w-5 h-5 text-stone-300 dark:text-stone-600 group-hover:text-amber-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Feedback Card */}
            <button
              onClick={() => router.push(`/teams/${team.id}?tab=feedback`)}
              className="h-full bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 text-left hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all group"
            >
              <div className="h-full flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100">{t('feedbackTitle')}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('feedbackCardDesc')}</p>
                  <div className="mt-auto pt-2">
                    <span className="text-xs text-stone-400">&nbsp;</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-stone-300 dark:text-stone-600 group-hover:text-purple-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Upgrade CTA for free teams */}
          {team.plan === 'free' && (
            <button
              onClick={() => router.push('/account/billing')}
              className="w-full bg-gradient-to-r from-amber-50 to-cyan-50 dark:from-amber-900/20 dark:to-cyan-900/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50 p-4 text-left hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">Pro</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">{t('billingUpgradeTitle')}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{t('billingUpgradeDesc')}</p>
                </div>
                <svg className="w-5 h-5 text-stone-300 dark:text-stone-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )}

          {/* Quick links to other sections */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push(`/teams/${team.id}?tab=coach`)}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              {t('coachQuestionsTab')}
            </button>
            <button
              onClick={() => router.push(`/teams/${team.id}?tab=settings`)}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              {t('teamsDetailSettings')}
            </button>
          </div>

          {/* Team Radar Chart */}
          {(() => {
            const radarAxes: RadarAxis[] = []
            if (wowStats?.scoresByAngle) {
              for (const [angle, score] of Object.entries(wowStats.scoresByAngle)) {
                if (score !== null) {
                  radarAxes.push({ key: angle, label: ANGLE_LABELS[angle] || angle, value: score })
                }
              }
            }
            if (vibeMetrics?.weekVibe?.value) {
              radarAxes.push({ key: 'vibe', label: 'Vibe', value: vibeMetrics.weekVibe.value })
            }
            if (radarAxes.length < 3) return null

            const sorted = [...radarAxes].sort((a, b) => b.value - a.value)
            const strengths = sorted.slice(0, 2)
            const focusAreas = sorted.slice(-2).reverse()

            return (
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Left: title + scores */}
                  <div className="sm:w-52 shrink-0 flex flex-col">
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('teamHealthRadar')}</h3>

                    <div className="space-y-3">
                      {/* Strengths */}
                      <div className="rounded-lg bg-green-50 dark:bg-green-900/15 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-green-600 dark:text-green-400 mb-1.5">{t('radarStrengths')}</div>
                        {strengths.map(s => (
                          <div key={s.key} className="flex items-center justify-between py-px">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              <span className="text-xs text-stone-700 dark:text-stone-300">{s.label}</span>
                            </div>
                            <span className="text-xs font-bold tabular-nums text-green-700 dark:text-green-400">{s.value.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Focus areas */}
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/15 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 mb-1.5">{t('radarFocusAreas')}</div>
                        {focusAreas.map(s => (
                          <div key={s.key} className="flex items-center justify-between py-px">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span className="text-xs text-stone-700 dark:text-stone-300">{s.label}</span>
                            </div>
                            <span className="text-xs font-bold tabular-nums text-amber-700 dark:text-amber-400">{s.value.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: radar chart centered */}
                  <div className="flex-1 flex items-center justify-center">
                    <RadarChart axes={radarAxes} size={400} />
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Share Results Section */}
          {shareUrl ? (
            <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('shareResultsTitle')}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 truncate">{shareUrl.replace('/vibe/t/', '/results/')}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const resultsUrl = shareUrl.replace('/vibe/t/', '/results/')
                    navigator.clipboard.writeText(resultsUrl)
                    setResultsCopied(true)
                    setTimeout(() => setResultsCopied(false), 2000)
                  }}
                  className="flex-1"
                >
                  {resultsCopied ? t('shareCopied') : t('shareCopy')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const resultsUrl = shareUrl.replace('/vibe/t/', '/results/')
                    window.open(resultsUrl, '_blank')
                  }}
                  className="flex-1"
                >
                  {t('shareOpen')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-dashed border-stone-300 dark:border-stone-600 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-stone-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-500 dark:text-stone-400">{t('shareResultsTitle')}</div>
                  <div className="text-xs text-stone-400 dark:text-stone-500">{t('shareResultsPlaceholder')}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section content (navigation is in the global header) */}
      {activeTab === 'vibe' && (
        <div className="space-y-6">
          <>
              {/* Share Link Section - right under intro */}
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3">
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
                    {/* Desktop: Show create button inline */}
                    {!shareUrl && !shareLoading && (
                      <div className="hidden sm:block">
                        <Button
                          onClick={handleGetShareLink}
                          loading={shareLoading}
                          size="sm"
                        >
                          {t('shareCreate')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Mobile: Full-width create button */}
                  {!shareUrl && !shareLoading && (
                    <div className="sm:hidden mt-3">
                      <Button
                        onClick={handleGetShareLink}
                        loading={shareLoading}
                        className="w-full"
                      >
                        {t('shareCreate')}
                      </Button>
                    </div>
                  )}

                  {/* Action buttons when link exists - responsive grid */}
                  {shareUrl && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl)
                        }}
                        className="w-full"
                      >
                        {t('shareCopy')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(shareUrl, '_blank')}
                        className="w-full"
                      >
                        {t('shareOpen')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowVibeAdvanced(!showVibeAdvanced)}
                        className={`w-full ${showVibeAdvanced ? 'bg-stone-100 dark:bg-stone-700' : ''}`}
                      >
                        {t('shareAdvanced')}
                      </Button>
                    </div>
                  )}

                  {/* Share Results Link */}
                  {shareUrl && (
                    <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('shareResultsTitle')}</div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 truncate">{shareUrl.replace('/vibe/t/', '/results/')}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const resultsUrl = shareUrl.replace('/vibe/t/', '/results/')
                            navigator.clipboard.writeText(resultsUrl)
                            setResultsCopied(true)
                            setTimeout(() => setResultsCopied(false), 2000)
                          }}
                          className="flex-1"
                        >
                          {resultsCopied ? t('shareCopied') : t('shareCopy')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const resultsUrl = shareUrl.replace('/vibe/t/', '/results/')
                            window.open(resultsUrl, '_blank')
                          }}
                          className="flex-1"
                        >
                          {t('shareOpen')}
                        </Button>
                      </div>
                    </div>
                  )}
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
        </div>
      )}

      {activeTab === 'wow' && (
        <div className="space-y-6">
          <>
              {/* Stats + New Session Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
                  <span><strong>{team.wow?.total_sessions || 0}</strong> sessions</span>
                  <span><strong>{team.wow?.active_sessions || 0}</strong> active</span>
                  {team.wow?.average_score && (
                    <span>Avg: <strong>{team.wow.average_score.toFixed(1)}</strong></span>
                  )}
                </div>
                <Link
                  href={`/teams/${team.id}/wow/new`}
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
                const currentTeamLevel = (team.wow?.level as WowLevel) || 'shu'
                const levelOrder: WowLevel[] = ['shu', 'ha', 'ri']
                const currentLevelIndex = levelOrder.indexOf(currentTeamLevel)

                // Filter sessions by their stored level (defaults to 'shu' for old sessions)
                const filteredSessions = wowSessions.filter(s => (s.level || 'shu') === sessionsLevelTab)

                const levelTabs: { id: WowLevel; kanji: string; label: string; locked: boolean; color: string; proLocked?: boolean }[] = [
                  { id: 'shu', kanji: '守', label: 'Shu', locked: false, color: 'amber' },
                  { id: 'ha', kanji: '破', label: 'Ha', locked: currentLevelIndex < 1 || team.plan !== 'pro', color: 'cyan', proLocked: team.plan !== 'pro' && currentLevelIndex >= 1 },
                  { id: 'ri', kanji: '離', label: 'Ri', locked: currentLevelIndex < 2 || team.plan !== 'pro', color: 'purple', proLocked: team.plan !== 'pro' && currentLevelIndex >= 2 },
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
                            {tab.locked && (tab.proLocked
                              ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">Pro</span>
                              : <span className="text-xs">🔒</span>
                            )}
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
                            href={`/wow/session/${session.id}`}
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
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <FeedbackTool teamId={team.id} teamName={team.name} />
      )}

      {/* Coach Tab — tier-aware switcher */}
      {activeTab === 'coach' && (
        <>
          {/* Free: ProGate paywall */}
          {team.plan === 'free' && (
            <ProGate teamId={team.id} isPro={false} feature="billingCoachFeature">
              <CoachQuestions
                pulseScore={team.vibe?.average_score || null}
                pulseParticipation={(() => {
                  const effectiveSize = team.expected_team_size || team.vibe?.participant_count || 1
                  const todayCount = team.vibe?.today_entries || 0
                  return effectiveSize > 0 ? Math.round((todayCount / effectiveSize) * 100) : 0
                })()}
                deltaTensions={
                  wowSessions
                    .filter(s => s.status === 'closed' && s.overall_score != null && s.overall_score < 3.5)
                    .map(s => ({ area: s.angle, score: s.overall_score as number }))
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 3)
                }
                teamName={team.name}
              />
            </ProGate>
          )}

          {/* Scrum Master: Smart Questions (rule-based) */}
          {team.plan === 'pro' && subscriptionTier === 'scrum_master' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">{t('smartQuestionsTitle')}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{t('smartQuestionsSubtitle')}</p>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 italic">{t('coachQuestionsExample')}</p>
                </div>

                <CoachQuestions
                  pulseScore={team.vibe?.average_score || null}
                  pulseParticipation={(() => {
                    const effectiveSize = team.expected_team_size || team.vibe?.participant_count || 1
                    const todayCount = team.vibe?.today_entries || 0
                    return effectiveSize > 0 ? Math.round((todayCount / effectiveSize) * 100) : 0
                  })()}
                  deltaTensions={
                    wowSessions
                      .filter(s => s.status === 'closed' && s.overall_score != null && s.overall_score < 3.5)
                      .map(s => ({ area: s.angle, score: s.overall_score as number }))
                      .sort((a, b) => a.score - b.score)
                      .slice(0, 3)
                  }
                  teamName={team.name}
                />
              </div>
            </div>
          )}

          {/* Agile Coach + Transition Coach: AI Coach */}
          {team.plan === 'pro' && (subscriptionTier === 'agile_coach' || subscriptionTier === 'transition_coach') && (
            <AiCoach
              teamId={team.id}
              teamName={team.name}
              subscriptionTier={subscriptionTier}
            />
          )}
        </>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Editable Team Settings */}
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('teamSettings')}</h3>

            {settingsSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-green-600 dark:text-green-400 text-sm">
                {t('teamSettingsSaved')}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="team-name" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  {t('newTeamName')}
                </label>
                <input
                  id="team-name"
                  name="name"
                  type="text"
                  defaultValue={team.name}
                  required
                  minLength={2}
                  className="block w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="team-description" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  {t('newTeamDescription')}
                </label>
                <textarea
                  id="team-description"
                  name="description"
                  rows={2}
                  defaultValue={team.description || ''}
                  className="block w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="team-size" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  {t('newTeamSize')}
                </label>
                <input
                  id="team-size"
                  name="expected_team_size"
                  type="number"
                  defaultValue={team.expected_team_size || ''}
                  min={1}
                  max={100}
                  placeholder={team.detected_team_size ? `${team.detected_team_size} (${t('detectedFromData')})` : t('newTeamSizePlaceholder')}
                  className="block w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                />
                {team.detected_team_size && !team.expected_team_size && (
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                    {t('detectedTeamSizeHint').replace('{n}', String(team.detected_team_size))}
                  </p>
                )}
              </div>

              <Button type="submit" loading={loading === 'save-settings'} className="w-full">
                {t('save')}
              </Button>
            </form>

            {/* Created date only — ID/slug hidden from UI */}
            <div className="mt-6 pt-6 border-t border-stone-200 dark:border-stone-700 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">{t('adminCreatedOn')}</span>
                <span className="text-stone-700 dark:text-stone-300">{new Date(team.created_at).toLocaleDateString()}</span>
              </div>
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
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
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
                  <span className="font-medium text-stone-900 dark:text-stone-100">Way of Work</span>
                </div>
                {team.tools_enabled.includes('wow') ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDisableTool('wow')}
                    loading={loading === 'disable-wow'}
                  >
                    {t('teamsToolDisable')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleEnableTool('wow')}
                    loading={loading === 'enable-wow'}
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
