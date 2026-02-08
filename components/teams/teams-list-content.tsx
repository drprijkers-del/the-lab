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

  // Shu-Ha-Ri level config for wow
  const shuHaRiConfig = {
    shu: { kanji: '守', label: 'Shu', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700' },
    ha: { kanji: '破', label: 'Ha', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-700' },
    ri: { kanji: '離', label: 'Ri', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700' },
  }

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-cyan-500 text-white'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
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
        {/* Levels info button - hidden for now */}
      </div>

      {/* Teams list */}
      {filteredTeams.length === 0 ? (
        <div className="bg-gradient-to-br from-stone-50 to-cyan-50/30 dark:from-stone-800 dark:to-cyan-900/20 rounded-2xl border border-stone-200 dark:border-stone-700 p-8 sm:p-12">
          <div className="max-w-md mx-auto text-center">
            {/* Lab flask icon - professional icon instead of emoji */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
              {t('teamsNoTeams')}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 mb-8">
              {t('teamsNoTeamsMessage')}
            </p>

            {/* Feature highlights - professional icons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
              <div className="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
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
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100">Vibe</div>
                <div className="text-xs text-stone-500 dark:text-stone-400">{t('emptyStateVibeDesc')}</div>
              </div>
              <div className="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-2">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm">Δ</span>
                </div>
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100">Way of Work</div>
                <div className="text-xs text-stone-500 dark:text-stone-400">{t('emptyStateWowDesc')}</div>
              </div>
              <div className="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('emptyStateInsightsTitle')}</div>
                <div className="text-xs text-stone-500 dark:text-stone-400">{t('emptyStateInsightsDesc')}</div>
              </div>
            </div>

            <Link href="/teams/new">
              <Button size="lg" className="px-8">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('teamsFirstTeam')}
              </Button>
            </Link>

            <p className="text-xs text-stone-400 dark:text-stone-500 mt-4">
              {t('emptyStateTime')}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map(team => {
            const wowLevel = team.wow?.level as 'shu' | 'ha' | 'ri' | undefined
            const levelConfig = wowLevel ? shuHaRiConfig[wowLevel] : null

            return (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="block bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-sm transition-all group"
              >
                {/* Header: Name + attention indicator */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {team.name}
                      </h3>
                      {/* Attention indicator - simple dot on mobile */}
                      {team.needs_attention && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                      )}
                    </div>
                    {/* Tool labels - hidden on mobile for cleaner look */}
                    <div className="hidden sm:flex flex-wrap gap-1 mt-1">
                      {team.tools_enabled.includes('vibe') && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded">
                          Vibe
                        </span>
                      )}
                      {team.tools_enabled.includes('wow') && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded">
                          Way of Work
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Shu-Ha-Ri level badge - hidden on mobile */}
                  {levelConfig && (
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${levelConfig.color}`}>
                        <span className="font-bold">{levelConfig.kanji}</span>
                        <span>{levelConfig.label}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Score indicators - simplified for mobile */}
                <div className="flex items-center gap-3 mb-3">
                  {team.vibe?.average_score && (
                    <div className="flex items-center gap-1">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
                        team.vibe.average_score >= 4 ? 'bg-green-500' :
                        team.vibe.average_score >= 3 ? 'bg-cyan-500' :
                        team.vibe.average_score >= 2 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}>
                        {team.vibe.average_score}
                      </div>
                      {/* Trend indicator */}
                      {team.vibe.trend && (
                        <div className={`flex items-center justify-center w-4 h-4 ${
                          team.vibe.trend === 'up' ? 'text-green-500' :
                          team.vibe.trend === 'down' ? 'text-red-500' :
                          'text-stone-400 dark:text-stone-500'
                        }`}>
                          {team.vibe.trend === 'up' && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                          {team.vibe.trend === 'down' && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                          {team.vibe.trend === 'stable' && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                            </svg>
                          )}
                        </div>
                      )}
                      <span className="hidden sm:inline text-xs text-stone-400 dark:text-stone-500">Vibe</span>
                    </div>
                  )}
                  {team.wow?.average_score && (
                    <div className="flex items-center gap-1">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
                        team.wow.average_score >= 4 ? 'bg-green-500' :
                        team.wow.average_score >= 3 ? 'bg-cyan-500' :
                        team.wow.average_score >= 2 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}>
                        {team.wow.average_score}
                      </div>
                      {/* Trend indicator */}
                      {team.wow.trend && (
                        <div className={`flex items-center justify-center w-4 h-4 ${
                          team.wow.trend === 'up' ? 'text-green-500' :
                          team.wow.trend === 'down' ? 'text-red-500' :
                          'text-stone-400 dark:text-stone-500'
                        }`}>
                          {team.wow.trend === 'up' && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                          {team.wow.trend === 'down' && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                          {team.wow.trend === 'stable' && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                            </svg>
                          )}
                        </div>
                      )}
                      <span className="hidden sm:inline text-xs text-stone-400 dark:text-stone-500">Way of Work</span>
                    </div>
                  )}
                  {!team.vibe?.average_score && !team.wow?.average_score && (
                    <span className="text-xs text-stone-400 dark:text-stone-500">{t('teamsNoData')}</span>
                  )}
                </div>

                {/* Participation progress (Pulse only) */}
                {team.vibe && (
                  <div className="mb-3">
                    {(() => {
                      const effectiveSize = team.expected_team_size || team.vibe.participant_count || 1
                      const todayCount = team.vibe.today_entries
                      const percentage = effectiveSize > 0 ? Math.round((todayCount / effectiveSize) * 100) : 0
                      const isComplete = percentage >= 80
                      const isLow = percentage < 50 && effectiveSize > 0

                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-stone-500 dark:text-stone-400">{t('statsToday')}</span>
                            <span className={`font-medium ${
                              isComplete ? 'text-green-600 dark:text-green-400' :
                              isLow ? 'text-amber-600 dark:text-amber-400' :
                              'text-stone-600 dark:text-stone-300'
                            }`}>
                              {todayCount}/{effectiveSize}
                            </span>
                          </div>
                          <div className="h-1 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isComplete ? 'bg-green-500' :
                                isLow ? 'bg-amber-500' :
                                'bg-cyan-500'
                              }`}
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Footer: Last activity - hidden on mobile */}
                <div className="hidden sm:block text-xs text-stone-400 dark:text-stone-500 pt-2 border-t border-stone-100 dark:border-stone-700">
                  {formatDate(team.last_updated)}
                </div>
              </Link>
            )
          })}
        </div>
      )}

    </div>
  )
}
