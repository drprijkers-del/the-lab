'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { UnifiedTeam, enableTool, disableTool, deleteTeam, exportPulseData, getShareLink, updateTeam } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'
import { OverallSignal } from '@/components/teams/overall-signal'
import { VibeSection } from '@/components/teams/sections/vibe-section'
import { WowSection } from '@/components/teams/sections/wow-section'
import { FeedbackSection } from '@/components/teams/sections/feedback-section'
import { CoachSection } from '@/components/teams/sections/coach-section'
import type { TeamMetrics, VibeInsight } from '@/domain/metrics/types'
import type { WowSessionWithStats, WowLevel } from '@/domain/wow/types'
import type { PublicWowStats } from '@/domain/metrics/public-actions'
import type { SubscriptionTier } from '@/domain/billing/tiers'
import { getFeaturesForTier } from '@/domain/billing/tiers'
import type { CrossTeamInsights } from '@/domain/coach/cross-team'

interface TeamDetailContentProps {
  team: UnifiedTeam
  vibeMetrics?: TeamMetrics | null
  vibeInsights?: VibeInsight[]
  wowSessions?: WowSessionWithStats[]
  wowStats?: PublicWowStats | null
  subscriptionTier?: SubscriptionTier
  crossTeamData?: CrossTeamInsights | null
}

type TabType = 'home' | 'vibe' | 'wow' | 'feedback' | 'coach' | 'settings'
type SectionType = 'vibe' | 'wow' | 'feedback' | 'coach'

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

export function TeamDetailContent({ team, vibeMetrics, vibeInsights = [], wowSessions = [], wowStats, subscriptionTier = 'free', crossTeamData }: TeamDetailContentProps) {
  const t = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tierFeatures = getFeaturesForTier(subscriptionTier)

  // Determine if settings view should be shown
  const getInitialTab = (): TabType => {
    const urlTab = searchParams.get('tab') as TabType | null
    if (urlTab === 'settings') return 'settings'
    return 'home'
  }

  // Which accordion section is expanded (null = all collapsed)
  const getInitialSection = (): SectionType | null => {
    const urlTab = searchParams.get('tab') as string | null
    const validSections: SectionType[] = ['vibe', 'wow', 'feedback', 'coach']
    if (urlTab && validSections.includes(urlTab as SectionType)) {
      // If coach tab requested but not available, fall back to vibe
      if (urlTab === 'coach' && !tierFeatures.coach) return 'vibe'
      return urlTab as SectionType
    }
    return 'vibe'
  }

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab)
  const [openSection, setOpenSection] = useState<SectionType | null>(getInitialSection)
  const [loading, setLoading] = useState<string | null>(null)
  const [showVibeAdvanced, setShowVibeAdvanced] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  const [resultsCopied, setResultsCopied] = useState(false)

  // Toolkit intro visibility (persisted in localStorage)
  const [showToolkitIntro, setShowToolkitIntro] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('toolkit_intro_visible')
    return stored === null ? true : stored === 'true'
  })

  const toggleToolkitIntro = () => {
    setShowToolkitIntro(prev => {
      const next = !prev
      localStorage.setItem('toolkit_intro_visible', String(next))
      return next
    })
  }

  // Toggle an accordion section (close if already open, open otherwise)
  const toggleSection = (section: SectionType) => {
    const next = openSection === section ? null : section
    setOpenSection(next)
    // Update URL to reflect open section (or clear it)
    if (next) {
      router.push(`/teams/${team.id}?tab=${next}`, { scroll: false })
    } else {
      router.push(`/teams/${team.id}`, { scroll: false })
    }
  }

  // Sync URL changes (browser back/forward)
  useEffect(() => {
    const urlTab = searchParams.get('tab') as string | null
    const validSections: SectionType[] = ['vibe', 'wow', 'feedback', 'coach']
    if (urlTab === 'settings') {
      setActiveTab('settings')
      setOpenSection(null)
    } else if (urlTab && validSections.includes(urlTab as SectionType)) {
      // If coach tab requested but not available, fall back to vibe
      const section = (urlTab === 'coach' && !tierFeatures.coach) ? 'vibe' : urlTab as SectionType
      setActiveTab('home')
      setOpenSection(section)
    } else {
      setActiveTab('home')
      if (!urlTab) setOpenSection('vibe')
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

    // Open the newly enabled section
    setOpenSection(tool)
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

    // Collapse section and go to settings after disabling
    setOpenSection(null)
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
        activeTab={activeTab === 'settings' ? 'settings' : openSection || 'home'}
        onCoachClick={() => toggleSection('coach')}
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

      {/* Zone 2 removed — section context is now part of accordion content */}

      {/* DASHBOARD — always visible (except when on settings) */}
      {activeTab !== 'settings' && (
        <div className="space-y-6">
          {/* Dashboard intro - collapsible */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
                {t('dashboardIntroTitle')}
              </h2>
              <button
                onClick={toggleToolkitIntro}
                className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
                title={showToolkitIntro ? 'Hide intro' : 'Show intro'}
              >
                <svg
                  className={`w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-transform ${
                    showToolkitIntro ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className="accordion-content" data-open={showToolkitIntro}>
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  {t('dashboardIntroText').split(/(\{vibeIcon\}|\{wowIcon\}|\{coachIcon\}|\{settingsIcon\})/).map((segment, i) => {
                    if (segment === '{vibeIcon}') return <svg key={i} className="w-3.5 h-3.5 inline-block -mt-px text-pink-500" viewBox="0 0 24 24" fill="none"><path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
                    if (segment === '{wowIcon}') return <span key={i} className="font-bold text-cyan-500">Δ</span>
                    if (segment === '{coachIcon}') return <svg key={i} className="w-3.5 h-3.5 inline-block -mt-px text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    if (segment === '{settingsIcon}') return <svg key={i} className="w-3.5 h-3.5 inline-block -mt-px text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    return segment
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              MOBILE CASCADE ACCORDION — each tile opens content below it
              Active tile is sticky so user can scroll content & tap to close
              ═══════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-1.5 sm:hidden">
            {/* Vibe */}
            <button
              onClick={() => toggleSection('vibe')}
              className={`bg-white dark:bg-stone-800 rounded-xl border p-2.5 text-left transition-all cursor-pointer touch-manipulation ${
                openSection === 'vibe'
                  ? 'border-pink-400 dark:border-pink-600 shadow-md ring-1 ring-pink-200 dark:ring-pink-800 sticky top-14 z-10'
                  : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5 text-pink-600 dark:text-pink-400" viewBox="0 0 24 24" fill="none">
                    <path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">Vibe</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">{t('vibeCardDesc')}</p>
                </div>
                <svg className={`w-4 h-4 shrink-0 transition-transform ${
                  openSection === 'vibe' ? 'text-pink-500 rotate-90' : 'text-stone-300 dark:text-stone-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            {openSection === 'vibe' && (
              <div className="pt-3 pb-4">
                <VibeSection
                  teamId={team.id}
                  shareUrl={shareUrl}
                  setShareUrl={setShareUrl}
                  shareLoading={shareLoading}
                  setShareLoading={setShareLoading}
                  showVibeAdvanced={showVibeAdvanced}
                  setShowVibeAdvanced={setShowVibeAdvanced}
                  handleGetShareLink={handleGetShareLink}
                  vibeMetrics={vibeMetrics}
                  vibeInsights={vibeInsights}
                  resultsCopied={resultsCopied}
                  setResultsCopied={setResultsCopied}
                />
              </div>
            )}

            {/* Way of Work */}
            <button
              onClick={() => toggleSection('wow')}
              className={`bg-white dark:bg-stone-800 rounded-xl border p-2.5 text-left transition-all cursor-pointer touch-manipulation ${
                openSection === 'wow'
                  ? 'border-cyan-400 dark:border-cyan-600 shadow-md ring-1 ring-cyan-200 dark:ring-cyan-800 sticky top-14 z-10'
                  : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">Δ</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">Way of Work</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">{t('wowCardDesc')}</p>
                </div>
                <svg className={`w-4 h-4 shrink-0 transition-transform ${
                  openSection === 'wow' ? 'text-cyan-500 rotate-90' : 'text-stone-300 dark:text-stone-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            {openSection === 'wow' && (
              <div className="pt-3 pb-4">
                <WowSection
                  teamId={team.id}
                  teamName={team.name}
                  teamPlan={team.plan}
                  wowStats={team.wow ? { total_sessions: team.wow.total_sessions || 0, active_sessions: team.wow.active_sessions || 0, average_score: team.wow.average_score, level: team.wow.level || 'shu' } : null}
                  wowSessions={wowSessions}
                  angleLabels={ANGLE_LABELS}
                  radarWowStats={wowStats}
                  vibeMetrics={vibeMetrics}
                  subscriptionTier={subscriptionTier}
                />
              </div>
            )}

            {/* Feedback */}
            <button
              onClick={() => toggleSection('feedback')}
              className={`bg-white dark:bg-stone-800 rounded-xl border p-2.5 text-left transition-all cursor-pointer touch-manipulation ${
                openSection === 'feedback'
                  ? 'border-purple-400 dark:border-purple-600 shadow-md ring-1 ring-purple-200 dark:ring-purple-800 sticky top-14 z-10'
                  : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">{t('feedbackTitle')}</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">{t('feedbackCardDesc')}</p>
                </div>
                <svg className={`w-4 h-4 shrink-0 transition-transform ${
                  openSection === 'feedback' ? 'text-purple-500 rotate-90' : 'text-stone-300 dark:text-stone-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            {openSection === 'feedback' && (
              <div className="pt-3 pb-4">
                <FeedbackSection teamId={team.id} teamName={team.name} />
              </div>
            )}

            {/* Coach — hidden for free tier */}
            {tierFeatures.coach && (
              <>
                <button
                  onClick={() => toggleSection('coach')}
                  className={`bg-white dark:bg-stone-800 rounded-xl border p-2.5 text-left transition-all cursor-pointer touch-manipulation ${
                    openSection === 'coach'
                      ? 'border-emerald-400 dark:border-emerald-600 shadow-md ring-1 ring-emerald-200 dark:ring-emerald-800 sticky top-14 z-10'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">{t('coachQuestionsTab')}</h3>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">{t('coachCardDesc')}</p>
                    </div>
                    <svg className={`w-4 h-4 shrink-0 transition-transform ${
                      openSection === 'coach' ? 'text-emerald-500 rotate-90' : 'text-stone-300 dark:text-stone-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                {openSection === 'coach' && (
                  <div className="pt-3 pb-4">
                    <CoachSection
                      teamId={team.id}
                      teamName={team.name}
                      teamPlan={team.plan}
                      subscriptionTier={subscriptionTier}
                      vibeAverageScore={team.vibe?.average_score || null}
                      vibeParticipation={(() => {
                        const effectiveSize = team.expected_team_size || team.vibe?.participant_count || 1
                        const todayCount = team.vibe?.today_entries || 0
                        return effectiveSize > 0 ? Math.round((todayCount / effectiveSize) * 100) : 0
                      })()}
                      wowSessions={wowSessions}
                      onNavigateToVibe={() => toggleSection('vibe')}
                      onNavigateToWow={() => toggleSection('wow')}
                      crossTeamEnabled={tierFeatures.crossTeam}
                      crossTeamData={crossTeamData}
                    />
                  </div>
                )}
              </>
            )}

            {/* Share Results */}
            <div
              className={`rounded-xl border p-2.5 text-left transition-all touch-manipulation ${
                shareUrl
                  ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 cursor-pointer'
                  : 'bg-stone-50 dark:bg-stone-800/50 border-dashed border-stone-300 dark:border-stone-600 opacity-60'
              }`}
              onClick={() => {
                if (shareUrl) {
                  const resultsUrl = shareUrl.replace('/vibe/t/', '/results/')
                  window.open(resultsUrl, '_blank')
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${shareUrl ? 'bg-pink-100 dark:bg-pink-900/50' : 'bg-stone-200 dark:bg-stone-700'}`}>
                  <svg className={`w-4.5 h-4.5 ${shareUrl ? 'text-pink-600 dark:text-pink-400' : 'text-stone-400 dark:text-stone-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm ${shareUrl ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'}`}>
                    {t('shareResultsTitle')}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {shareUrl ? t('shareCardDesc') : t('shareResultsPlaceholder')}
                  </p>
                </div>
                {shareUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const resultsUrl = shareUrl.replace('/vibe/t/', '/results/')
                      navigator.clipboard.writeText(resultsUrl)
                      setResultsCopied(true)
                      setTimeout(() => setResultsCopied(false), 2000)
                    }}
                    className="p-1 rounded-md text-stone-400 dark:text-stone-500 hover:text-pink-500 shrink-0"
                  >
                    {resultsCopied ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              DESKTOP LAYOUT — completely untouched, hidden on mobile
              ═══════════════════════════════════════════════════════════ */}
          <div className="hidden sm:block space-y-6">
          {/* Tool Cards — 5 tiles on desktop */}
          <div className="sticky top-14 z-10 bg-stone-50 dark:bg-stone-900 pb-4 sm:pb-6 -mb-4 sm:-mb-6 pt-4 sm:pt-6 -mt-4 sm:-mt-6">
            <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-5 sm:gap-3">
            {/* Vibe */}
            <button
              onClick={() => toggleSection('vibe')}
              className={`relative bg-white dark:bg-stone-800 rounded-xl border p-2.5 sm:p-3 text-left hover:shadow-md transition-all group cursor-pointer touch-manipulation ${
                openSection === 'vibe'
                  ? 'border-pink-400 dark:border-pink-600 shadow-md ring-1 ring-pink-200 dark:ring-pink-800'
                  : 'border-stone-200 dark:border-stone-700 hover:border-pink-300 dark:hover:border-pink-700'
              }`}
            >
              {openSection === 'vibe' && (
                <div className="hidden sm:block absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-pink-400 dark:border-t-pink-600" />
              )}
              {/* Mobile: horizontal row | Desktop: vertical card */}
              <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
                <div className="flex items-center justify-between sm:w-full sm:mb-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" viewBox="0 0 24 24" fill="none">
                      <path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <svg className={`hidden sm:block w-4 h-4 transition-all mt-1 ${
                    openSection === 'vibe'
                      ? 'text-pink-500 rotate-90'
                      : 'text-stone-300 dark:text-stone-600 group-hover:text-pink-500 group-hover:translate-x-0.5'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">Vibe</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug sm:block hidden">{t('vibeCardDesc')}</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 sm:hidden">{t('vibeCardDesc')}</p>
                </div>
                <svg className={`sm:hidden w-4 h-4 shrink-0 transition-transform ${
                  openSection === 'vibe' ? 'text-pink-500 rotate-90' : 'text-stone-300 dark:text-stone-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Way of Work */}
            <button
              onClick={() => toggleSection('wow')}
              className={`relative bg-white dark:bg-stone-800 rounded-xl border p-2.5 sm:p-3 text-left hover:shadow-md transition-all group cursor-pointer touch-manipulation ${
                openSection === 'wow'
                  ? 'border-cyan-400 dark:border-cyan-600 shadow-md ring-1 ring-cyan-200 dark:ring-cyan-800'
                  : 'border-stone-200 dark:border-stone-700 hover:border-cyan-300 dark:hover:border-cyan-700'
              }`}
            >
              {openSection === 'wow' && (
                <div className="hidden sm:block absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-cyan-400 dark:border-t-cyan-600" />
              )}
              <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
                <div className="flex items-center justify-between sm:w-full sm:mb-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <span className="text-lg sm:text-xl font-bold text-cyan-600 dark:text-cyan-400">Δ</span>
                  </div>
                  <svg className={`hidden sm:block w-4 h-4 transition-all mt-1 ${
                    openSection === 'wow'
                      ? 'text-cyan-500 rotate-90'
                      : 'text-stone-300 dark:text-stone-600 group-hover:text-cyan-500 group-hover:translate-x-0.5'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">Way of Work</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug sm:block hidden">{t('wowCardDesc')}</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 sm:hidden">{t('wowCardDesc')}</p>
                </div>
                <svg className={`sm:hidden w-4 h-4 shrink-0 transition-transform ${
                  openSection === 'wow' ? 'text-cyan-500 rotate-90' : 'text-stone-300 dark:text-stone-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Feedback */}
            <button
              onClick={() => toggleSection('feedback')}
              className={`relative bg-white dark:bg-stone-800 rounded-xl border p-2.5 sm:p-3 text-left hover:shadow-md transition-all group cursor-pointer touch-manipulation ${
                openSection === 'feedback'
                  ? 'border-purple-400 dark:border-purple-600 shadow-md ring-1 ring-purple-200 dark:ring-purple-800'
                  : 'border-stone-200 dark:border-stone-700 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              {openSection === 'feedback' && (
                <div className="hidden sm:block absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-purple-400 dark:border-t-purple-600" />
              )}
              <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
                <div className="flex items-center justify-between sm:w-full sm:mb-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <svg className={`hidden sm:block w-4 h-4 transition-all mt-1 ${
                    openSection === 'feedback'
                      ? 'text-purple-500 rotate-90'
                      : 'text-stone-300 dark:text-stone-600 group-hover:text-purple-500 group-hover:translate-x-0.5'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">{t('feedbackTitle')}</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug sm:block hidden">{t('feedbackCardDesc')}</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 sm:hidden">{t('feedbackCardDesc')}</p>
                </div>
                <svg className={`sm:hidden w-4 h-4 shrink-0 transition-transform ${
                  openSection === 'feedback' ? 'text-purple-500 rotate-90' : 'text-stone-300 dark:text-stone-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Preparation / Coach — hidden for free tier */}
            {tierFeatures.coach && (
              <button
                onClick={() => toggleSection('coach')}
                className={`relative bg-white dark:bg-stone-800 rounded-xl border p-2.5 sm:p-3 text-left hover:shadow-md transition-all group cursor-pointer touch-manipulation ${
                  openSection === 'coach'
                    ? 'border-emerald-400 dark:border-emerald-600 shadow-md ring-1 ring-emerald-200 dark:ring-emerald-800'
                    : 'border-stone-200 dark:border-stone-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                {openSection === 'coach' && (
                  <div className="hidden sm:block absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-emerald-400 dark:border-t-emerald-600" />
                )}
                <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
                  <div className="flex items-center justify-between sm:w-full sm:mb-2">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <svg className={`hidden sm:block w-4 h-4 transition-all mt-1 ${
                      openSection === 'coach'
                        ? 'text-emerald-500 rotate-90'
                        : 'text-stone-300 dark:text-stone-600 group-hover:text-emerald-500 group-hover:translate-x-0.5'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">{t('coachQuestionsTab')}</h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug sm:block hidden">{t('coachCardDesc')}</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 sm:hidden">{t('coachCardDesc')}</p>
                  </div>
                  <svg className={`sm:hidden w-4 h-4 shrink-0 transition-transform ${
                    openSection === 'coach' ? 'text-emerald-500 rotate-90' : 'text-stone-300 dark:text-stone-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )}

            {/* Share Results — opens external page */}
            <div
              className={`relative rounded-xl border p-2.5 sm:p-3 text-left transition-all group touch-manipulation ${
                shareUrl
                  ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md cursor-pointer'
                  : 'bg-stone-50 dark:bg-stone-800/50 border-dashed border-stone-300 dark:border-stone-600 opacity-60'
              }`}
              onClick={() => {
                if (shareUrl) {
                  const resultsUrl = shareUrl.replace('/vibe/t/', '/results/')
                  window.open(resultsUrl, '_blank')
                }
              }}
            >
              <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
                <div className="flex items-center justify-between sm:w-full sm:mb-2">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${shareUrl ? 'bg-pink-100 dark:bg-pink-900/50 group-hover:scale-105' : 'bg-stone-200 dark:bg-stone-700'} transition-transform`}>
                    <svg className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${shareUrl ? 'text-pink-600 dark:text-pink-400' : 'text-stone-400 dark:text-stone-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  {shareUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const resultsUrl = shareUrl.replace('/vibe/t/', '/results/')
                        navigator.clipboard.writeText(resultsUrl)
                        setResultsCopied(true)
                        setTimeout(() => setResultsCopied(false), 2000)
                      }}
                      className="hidden sm:block p-1 rounded-md text-stone-400 dark:text-stone-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                      title={t('shareCopy')}
                    >
                      {resultsCopied ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm ${shareUrl ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'}`}>
                    {t('shareResultsTitle')}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug sm:block hidden">
                    {shareUrl ? t('shareCardDesc') : t('shareResultsPlaceholder')}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 sm:hidden">
                    {shareUrl ? t('shareCardDesc') : t('shareResultsPlaceholder')}
                  </p>
                </div>
                {shareUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const resultsUrl = shareUrl.replace('/vibe/t/', '/results/')
                      navigator.clipboard.writeText(resultsUrl)
                      setResultsCopied(true)
                      setTimeout(() => setResultsCopied(false), 2000)
                    }}
                    className="sm:hidden p-1 rounded-md text-stone-400 dark:text-stone-500 hover:text-pink-500 shrink-0"
                  >
                    {resultsCopied ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION CONTENT — appears at same position below tiles
              ═══════════════════════════════════════════════════════════════════ */}
          {openSection && (
            <div className={`relative ${
              openSection === 'vibe' ? 'border-t-2 border-pink-400 dark:border-pink-600' :
              openSection === 'wow' ? 'border-t-2 border-cyan-400 dark:border-cyan-600' :
              openSection === 'feedback' ? 'border-t-2 border-purple-400 dark:border-purple-600' :
              openSection === 'coach' ? 'border-t-2 border-emerald-400 dark:border-emerald-600' :
              ''
            } pt-6 -mt-3`}>
              {openSection === 'vibe' && (
                <VibeSection
                  teamId={team.id}
                  shareUrl={shareUrl}
                  setShareUrl={setShareUrl}
                  shareLoading={shareLoading}
                  setShareLoading={setShareLoading}
                  showVibeAdvanced={showVibeAdvanced}
                  setShowVibeAdvanced={setShowVibeAdvanced}
                  handleGetShareLink={handleGetShareLink}
                  vibeMetrics={vibeMetrics}
                  vibeInsights={vibeInsights}
                  resultsCopied={resultsCopied}
                  setResultsCopied={setResultsCopied}
                />
              )}
              {openSection === 'wow' && (
                <WowSection
                  teamId={team.id}
                  teamName={team.name}
                  teamPlan={team.plan}
                  wowStats={team.wow ? { total_sessions: team.wow.total_sessions || 0, active_sessions: team.wow.active_sessions || 0, average_score: team.wow.average_score, level: team.wow.level || 'shu' } : null}
                  wowSessions={wowSessions}
                  angleLabels={ANGLE_LABELS}
                  radarWowStats={wowStats}
                  vibeMetrics={vibeMetrics}
                  subscriptionTier={subscriptionTier}
                />
              )}
              {openSection === 'feedback' && (
                <FeedbackSection teamId={team.id} teamName={team.name} />
              )}
              {openSection === 'coach' && tierFeatures.coach && (
                <CoachSection
                  teamId={team.id}
                  teamName={team.name}
                  teamPlan={team.plan}
                  subscriptionTier={subscriptionTier}
                  vibeAverageScore={team.vibe?.average_score || null}
                  vibeParticipation={(() => {
                    const effectiveSize = team.expected_team_size || team.vibe?.participant_count || 1
                    const todayCount = team.vibe?.today_entries || 0
                    return effectiveSize > 0 ? Math.round((todayCount / effectiveSize) * 100) : 0
                  })()}
                  wowSessions={wowSessions}
                  onNavigateToVibe={() => toggleSection('vibe')}
                  onNavigateToWow={() => toggleSection('wow')}
                  crossTeamEnabled={tierFeatures.crossTeam}
                  crossTeamData={crossTeamData}
                />
              )}
            </div>
          )}
          </div>

          {/* Upgrade CTA for free teams */}
          {subscriptionTier === 'free' && (
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

        </div>
      )}

      {/* Old tab content removed — sections now unfold inline via accordion above */}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Editable Team Settings */}
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 sm:p-6">
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
            <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 sm:p-6">
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
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 sm:p-6">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('teamsToolsEnabled')}</h3>
            <div className="space-y-3">
              {/* Vibe tool card */}
              <div className={`p-4 rounded-xl border transition-all ${
                team.tools_enabled.includes('vibe')
                  ? 'bg-pink-50 dark:bg-pink-900/10 border-pink-200 dark:border-pink-800'
                  : 'bg-stone-50 dark:bg-stone-700/50 border-stone-200 dark:border-stone-700'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      team.tools_enabled.includes('vibe') ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-stone-200 dark:bg-stone-600'
                    }`}>
                      <svg className={`w-5 h-5 ${team.tools_enabled.includes('vibe') ? 'text-pink-500' : 'text-stone-400'}`} viewBox="0 0 24 24" fill="none">
                        <path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 dark:text-stone-100">Vibe</span>
                        {team.tools_enabled.includes('vibe') && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full">{t('teamsToolEnabled')}</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('vibeToolDesc')}</p>
                      {team.tools_enabled.includes('vibe') && (
                        <p className="text-xs text-pink-600 dark:text-pink-400 mt-1.5 flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          {t('vibeToolActiveHint')}
                        </p>
                      )}
                    </div>
                  </div>
                  {team.tools_enabled.includes('vibe') ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDisableTool('vibe')}
                      loading={loading === 'disable-vibe'}
                      className="shrink-0"
                    >
                      {t('teamsToolDisable')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleEnableTool('vibe')}
                      loading={loading === 'enable-vibe'}
                      className="shrink-0"
                    >
                      {t('teamsToolEnable')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Way of Work tool card */}
              <div className={`p-4 rounded-xl border transition-all ${
                team.tools_enabled.includes('wow')
                  ? 'bg-cyan-50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800'
                  : 'bg-stone-50 dark:bg-stone-700/50 border-stone-200 dark:border-stone-700'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      team.tools_enabled.includes('wow') ? 'bg-cyan-100 dark:bg-cyan-900/30' : 'bg-stone-200 dark:bg-stone-600'
                    }`}>
                      <span className={`font-bold text-lg ${team.tools_enabled.includes('wow') ? 'text-cyan-500' : 'text-stone-400'}`}>Δ</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 dark:text-stone-100">Way of Work</span>
                        {team.tools_enabled.includes('wow') && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full">{t('teamsToolEnabled')}</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('wowToolDesc')}</p>
                      {team.tools_enabled.includes('wow') && (
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1.5 flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          {t('wowToolActiveHint')}
                        </p>
                      )}
                    </div>
                  </div>
                  {team.tools_enabled.includes('wow') ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDisableTool('wow')}
                      loading={loading === 'disable-wow'}
                      className="shrink-0"
                    >
                      {t('teamsToolDisable')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleEnableTool('wow')}
                      loading={loading === 'enable-wow'}
                      className="shrink-0"
                    >
                      {t('teamsToolEnable')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4 sm:p-6">
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
