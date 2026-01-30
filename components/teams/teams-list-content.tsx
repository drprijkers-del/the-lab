'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UnifiedTeam } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'

interface TeamsListContentProps {
  teams: UnifiedTeam[]
}

type FilterType = 'all' | 'pulse' | 'delta' | 'needs_attention'

export function TeamsListContent({ teams }: TeamsListContentProps) {
  const t = useTranslation()
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredTeams = teams.filter(team => {
    if (filter === 'all') return true
    if (filter === 'pulse') return team.tools_enabled.includes('pulse')
    if (filter === 'delta') return team.tools_enabled.includes('delta')
    if (filter === 'needs_attention') return team.needs_attention
    return true
  })

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('teamsFilterAll') },
    { key: 'pulse', label: t('teamsFilterPulse') },
    { key: 'delta', label: t('teamsFilterDelta') },
    { key: 'needs_attention', label: t('teamsFilterAttention') },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t('statsToday').toLowerCase()
    if (diffDays === 1) return 'gisteren'
    if (diffDays < 7) return `${diffDays} dagen geleden`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-cyan-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {label}
            {key === 'needs_attention' && teams.filter(t => t.needs_attention).length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-red-500 text-white rounded-full">
                {teams.filter(t => t.needs_attention).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Teams list */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-stone-400 text-5xl mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-stone-700 mb-2">{t('teamsNoTeams')}</h3>
          <p className="text-stone-500 mb-6">{t('teamsNoTeamsMessage')}</p>
          <Link href="/teams/new">
            <Button>{t('teamsFirstTeam')}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTeams.map(team => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="block bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Team name and badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-stone-900 truncate">{team.name}</h3>
                    {team.needs_attention && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                        {t('teamsNeedsAttention')}
                      </span>
                    )}
                  </div>

                  {/* Tools badges */}
                  <div className="flex gap-2 mb-3">
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

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-4 text-sm text-stone-500">
                    {team.pulse && (
                      <div className="flex items-center gap-1">
                        <span className="text-pink-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span>{team.pulse.today_entries} {t('teamsPulseSignals')}</span>
                        {team.pulse.average_score && (
                          <span className="text-stone-400">({team.pulse.average_score})</span>
                        )}
                      </div>
                    )}
                    {team.delta && (
                      <div className="flex items-center gap-1">
                        <span className="text-cyan-500 font-bold text-sm">Δ</span>
                        <span>{team.delta.total_sessions} {t('teamsDeltaSessions')}</span>
                        {team.delta.average_score && (
                          <span className="text-stone-400">({team.delta.average_score})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Last activity */}
                <div className="text-right text-sm text-stone-400 shrink-0">
                  <div>{formatDate(team.last_updated)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
