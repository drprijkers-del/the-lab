'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { UnifiedTeam, enableTool, disableTool, deleteTeam } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'
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

type TabType = 'pulse' | 'delta' | 'settings'

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
    if (urlTab && ['pulse', 'delta', 'settings'].includes(urlTab)) {
      // Only use URL tab if the tool is enabled (or it's settings)
      if (urlTab === 'settings') return 'settings'
      if (team.tools_enabled.includes(urlTab)) return urlTab
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
    if (urlTab && ['pulse', 'delta', 'settings'].includes(urlTab)) {
      if (urlTab === 'settings' || team.tools_enabled.includes(urlTab)) {
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

  const tabs: { key: TabType; label: string }[] = [
    { key: 'pulse', label: t('teamsDetailPulse') },
    { key: 'delta', label: t('teamsDetailDelta') },
    { key: 'settings', label: t('teamsDetailSettings') },
  ]

  return (
    <div className="space-y-6">
      {/* Team header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-stone-900">{team.name}</h1>
          {team.needs_attention && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {t('teamsNeedsAttention')}
            </span>
          )}
        </div>
        {team.description && (
          <p className="text-stone-600">{team.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <div className="flex gap-6">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              {label}
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
                  <div className="bg-white rounded-xl border border-stone-200 p-4">
                    <div className="text-2xl font-bold text-stone-900">{team.pulse.participant_count}</div>
                    <div className="text-sm text-stone-500">{t('adminParticipants')}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-stone-200 p-4">
                    <div className="text-2xl font-bold text-stone-900">
                      {pulseMetrics?.maturity?.daysOfData ?? 0}
                    </div>
                    <div className="text-sm text-stone-500">Dagen data</div>
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
            <div className="text-center py-12 bg-stone-50 rounded-xl">
              <div className="text-stone-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-700 mb-2">{t('teamsPulseNotEnabled')}</h3>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-stone-900">{team.delta.total_sessions}</div>
                    <div className="text-xs text-stone-500">{t('sessions')}</div>
                  </div>
                  <div className="w-px h-8 bg-stone-200" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-600">{team.delta.active_sessions}</div>
                    <div className="text-xs text-stone-500">{t('active')}</div>
                  </div>
                  {team.delta.average_score && (
                    <>
                      <div className="w-px h-8 bg-stone-200" />
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          team.delta.average_score >= 4 ? 'text-green-600' :
                          team.delta.average_score >= 3 ? 'text-cyan-600' :
                          team.delta.average_score >= 2 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {team.delta.average_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-stone-500">{t('teamsAvgScore')}</div>
                      </div>
                    </>
                  )}
                </div>
                <Link href={`/teams/${team.id}/delta/new`} className="shrink-0">
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
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-100">
                    <h3 className="font-semibold text-stone-900">{t('sessions')}</h3>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {deltaSessions.map(session => (
                      <Link
                        key={session.id}
                        href={`/delta/session/${session.id}`}
                        className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                            session.status === 'active' ? 'bg-cyan-500' : 'bg-stone-400'
                          }`}>
                            {(ANGLE_LABELS[session.angle] || session.angle).charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-stone-900">
                              {ANGLE_LABELS[session.angle] || session.angle}
                            </div>
                            <div className="text-sm text-stone-500">
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
              <div className="pt-4 border-t border-stone-200">
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
            <div className="text-center py-12 bg-stone-50 rounded-xl">
              <div className="text-cyan-400 mb-4 text-4xl font-bold">Δ</div>
              <h3 className="font-semibold text-stone-700 mb-2">{t('teamsDeltaNotEnabled')}</h3>
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

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Team info */}
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h3 className="font-semibold text-stone-900 mb-4">{t('teamSettings')}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">ID</span>
                <span className="text-stone-700 font-mono">{team.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Slug</span>
                <span className="text-stone-700">{team.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t('adminCreatedOn')}</span>
                <span className="text-stone-700">{new Date(team.created_at).toLocaleDateString()}</span>
              </div>
              {team.expected_team_size && (
                <div className="flex justify-between">
                  <span className="text-stone-500">{t('newTeamSize')}</span>
                  <span className="text-stone-700">{team.expected_team_size}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tool toggles */}
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h3 className="font-semibold text-stone-900 mb-4">{t('teamsToolsEnabled')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-pink-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="font-medium">Pulse</span>
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
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-cyan-500 font-bold">Δ</span>
                  <span className="font-medium">Delta</span>
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
          <div className="bg-red-50 rounded-xl border border-red-200 p-6">
            <h3 className="font-semibold text-red-900 mb-2">{t('teamDeleteTitle')}</h3>
            <p className="text-sm text-red-700 mb-4">{t('teamDeleteMessage')}</p>
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
