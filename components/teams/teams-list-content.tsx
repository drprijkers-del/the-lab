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
  const [showLevelsModal, setShowLevelsModal] = useState(false)

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

  // Calculate maturity level for a team
  const getMaturityLevel = (team: UnifiedTeam) => {
    const sessionsCount = (team.ceremonies?.total_sessions || 0) + (team.vibe?.participant_count || 0)
    const avgScore = team.vibe?.average_score || team.ceremonies?.average_score || 0

    if (sessionsCount >= 20 && avgScore >= 3.5) return 'mature'
    if (sessionsCount >= 5) return 'medium'
    return 'basic'
  }

  const maturityConfig = {
    basic: { label: t('maturityBasic'), color: 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300' },
    medium: { label: t('maturityMedium'), color: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300' },
    mature: { label: t('maturityMature'), color: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' },
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
        {/* Levels info button - hidden on mobile, visible in Coming Next menu */}
        <button
          onClick={() => setShowLevelsModal(true)}
          className="hidden sm:flex ml-auto px-3 py-2 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors items-center gap-1.5"
        >
          {t('maturityViewLevels')}
        </button>
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
                <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100">Vibe</div>
                <div className="text-xs text-stone-500 dark:text-stone-400">{t('emptyStateVibeDesc')}</div>
              </div>
              <div className="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-2">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm">Δ</span>
                </div>
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100">Ceremonies</div>
                <div className="text-xs text-stone-500 dark:text-stone-400">{t('emptyStateCeremoniesDesc')}</div>
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
            const maturity = getMaturityLevel(team)
            const config = maturityConfig[maturity]

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
                      {team.tools_enabled.includes('ceremonies') && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded">
                          Ceremonies
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Maturity badge - hidden on mobile */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
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
                  {team.ceremonies?.average_score && (
                    <div className="flex items-center gap-1">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
                        team.ceremonies.average_score >= 4 ? 'bg-green-500' :
                        team.ceremonies.average_score >= 3 ? 'bg-cyan-500' :
                        team.ceremonies.average_score >= 2 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}>
                        {team.ceremonies.average_score}
                      </div>
                      {/* Trend indicator */}
                      {team.ceremonies.trend && (
                        <div className={`flex items-center justify-center w-4 h-4 ${
                          team.ceremonies.trend === 'up' ? 'text-green-500' :
                          team.ceremonies.trend === 'down' ? 'text-red-500' :
                          'text-stone-400 dark:text-stone-500'
                        }`}>
                          {team.ceremonies.trend === 'up' && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                          {team.ceremonies.trend === 'down' && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                          {team.ceremonies.trend === 'stable' && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                            </svg>
                          )}
                        </div>
                      )}
                      <span className="hidden sm:inline text-xs text-stone-400 dark:text-stone-500">Ceremonies</span>
                    </div>
                  )}
                  {!team.vibe?.average_score && !team.ceremonies?.average_score && (
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

      {/* Levels Modal */}
      {showLevelsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLevelsModal(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">{t('maturityLevel')}</h2>
              <button onClick={() => setShowLevelsModal(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Starter Level */}
              <div className="p-4 rounded-xl border-2 border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-stone-900 dark:text-stone-100">{t('maturityBasic')}</span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full">
                    {t('maturityFree')}
                  </span>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">{t('maturityStarterDesc')}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{t('maturityStarterFeatures')}</p>
              </div>

              {/* Intermediate Level */}
              <div className="p-4 rounded-xl border-2 border-cyan-300 dark:border-cyan-600 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-stone-900 dark:text-stone-100">{t('maturityMedium')}</span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full">
                    {t('maturityPaid')}
                  </span>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">{t('maturityMediumDesc')}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">{t('maturityMediumFeatures')}</p>
                <div className="flex items-center gap-2 text-xs text-cyan-600 dark:text-cyan-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  5+ sessies of 5+ dagen actief
                </div>
              </div>

              {/* Expert Level */}
              <div className="p-4 rounded-xl border-2 border-amber-300 dark:border-amber-600 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-stone-900 dark:text-stone-100">{t('maturityMature')}</span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full">
                    {t('maturityPaid')}
                  </span>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">{t('maturityMatureDesc')}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">{t('maturityMatureFeatures')}</p>
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  20+ sessies + score 3.5+
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-600">
                <a
                  href="mailto:expert@pinkpollos.nl?subject=Pulse Premium Interest"
                  className="block w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl text-center transition-colors"
                >
                  {t('maturityUpgradeTitle')} →
                </a>
                <p className="text-xs text-stone-500 dark:text-stone-400 text-center mt-2">
                  {t('maturityUpgradeDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
