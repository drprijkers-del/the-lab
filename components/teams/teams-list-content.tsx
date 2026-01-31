'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UnifiedTeam } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'

interface TeamsListContentProps {
  teams: UnifiedTeam[]
}

type FilterType = 'all' | 'needs_attention'

export function TeamsListContent({ teams }: TeamsListContentProps) {
  const t = useTranslation()
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredTeams = teams.filter(team => {
    if (filter === 'all') return true
    if (filter === 'needs_attention') return team.needs_attention
    return true
  })

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('teamsFilterAll') },
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map(team => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="block bg-white rounded-xl border border-stone-200 p-4 hover:border-cyan-300 hover:shadow-sm transition-all group"
            >
              {/* Header: Name + attention badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-stone-900 truncate group-hover:text-cyan-600 transition-colors">
                  {team.name}
                </h3>
                {team.needs_attention && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2" title={t('teamsNeedsAttention')} />
                )}
              </div>

              {/* Score indicators */}
              <div className="flex items-center gap-3 mb-3">
                {team.pulse?.average_score && (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                      team.pulse.average_score >= 4 ? 'bg-green-500' :
                      team.pulse.average_score >= 3 ? 'bg-cyan-500' :
                      team.pulse.average_score >= 2 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}>
                      {team.pulse.average_score}
                    </div>
                    <span className="text-xs text-stone-400">Pulse</span>
                  </div>
                )}
                {team.delta?.average_score && (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                      team.delta.average_score >= 4 ? 'bg-green-500' :
                      team.delta.average_score >= 3 ? 'bg-cyan-500' :
                      team.delta.average_score >= 2 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}>
                      {team.delta.average_score}
                    </div>
                    <span className="text-xs text-stone-400">Delta</span>
                  </div>
                )}
                {!team.pulse?.average_score && !team.delta?.average_score && (
                  <span className="text-xs text-stone-400">{t('teamsNoData')}</span>
                )}
              </div>

              {/* Footer: Last activity */}
              <div className="text-xs text-stone-400 pt-2 border-t border-stone-100">
                {formatDate(team.last_updated)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
