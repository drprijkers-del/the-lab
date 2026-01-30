'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UnifiedTeam, enableTool, disableTool, deleteTeam } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'

interface TeamDetailContentProps {
  team: UnifiedTeam
}

type TabType = 'pulse' | 'delta' | 'settings'

export function TeamDetailContent({ team }: TeamDetailContentProps) {
  const t = useTranslation()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>(
    team.tools_enabled.includes('pulse') ? 'pulse' :
    team.tools_enabled.includes('delta') ? 'delta' : 'settings'
  )
  const [loading, setLoading] = useState<string | null>(null)

  const handleEnableTool = async (tool: 'pulse' | 'delta') => {
    setLoading(`enable-${tool}`)
    await enableTool(team.id, tool)
    setLoading(null)
    router.refresh()
  }

  const handleDisableTool = async (tool: 'pulse' | 'delta') => {
    setLoading(`disable-${tool}`)
    await disableTool(team.id, tool)
    setLoading(null)
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
        <div className="flex gap-2 mt-3">
          {team.tools_enabled.includes('pulse') && (
            <span className="px-2 py-0.5 text-xs font-medium bg-pink-100 text-pink-700 rounded-full">
              Pulse
            </span>
          )}
          {team.tools_enabled.includes('delta') && (
            <span className="px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700 rounded-full">
              Delta
            </span>
          )}
        </div>
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
            <>
              {/* Pulse stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="text-2xl font-bold text-stone-900">{team.pulse.participant_count}</div>
                  <div className="text-sm text-stone-500">{t('adminParticipants')}</div>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="text-2xl font-bold text-stone-900">{team.pulse.today_entries}</div>
                  <div className="text-sm text-stone-500">{t('adminToday')}</div>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="text-2xl font-bold text-stone-900">
                    {team.pulse.average_score ?? '-'}
                  </div>
                  <div className="text-sm text-stone-500">{t('teamsAvgScore')}</div>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="text-2xl font-bold text-stone-900">
                    {team.pulse.trend === 'up' ? '↑' : team.pulse.trend === 'down' ? '↓' : '-'}
                  </div>
                  <div className="text-sm text-stone-500">{t('trendLabel')}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link href={`/pulse/admin/teams/${team.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    {t('teamsGoToPulse')}
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => handleDisableTool('pulse')}
                  loading={loading === 'disable-pulse'}
                  className="text-red-600 hover:text-red-700"
                >
                  {t('teamsToolDisable')}
                </Button>
              </div>
            </>
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
              {/* Delta stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="text-2xl font-bold text-stone-900">{team.delta.total_sessions}</div>
                  <div className="text-sm text-stone-500">{t('sessions')}</div>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="text-2xl font-bold text-stone-900">{team.delta.active_sessions}</div>
                  <div className="text-sm text-stone-500">{t('active')}</div>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="text-2xl font-bold text-stone-900">
                    {team.delta.average_score ?? '-'}
                  </div>
                  <div className="text-sm text-stone-500">{t('teamsAvgScore')}</div>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="text-2xl font-bold text-stone-900">{team.delta.closed_sessions}</div>
                  <div className="text-sm text-stone-500">{t('sessionsCompleted')}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link href={`/delta/teams/${team.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    {t('teamsGoToDelta')}
                  </Button>
                </Link>
                <Button
                  variant="secondary"
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
