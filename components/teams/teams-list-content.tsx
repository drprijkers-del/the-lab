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
    const sessionsCount = (team.delta?.total_sessions || 0) + (team.pulse?.participant_count || 0)
    const avgScore = team.pulse?.average_score || team.delta?.average_score || 0

    if (sessionsCount >= 20 && avgScore >= 3.5) return 'mature'
    if (sessionsCount >= 5) return 'medium'
    return 'basic'
  }

  const maturityConfig = {
    basic: { label: t('maturityBasic'), icon: '🌱', color: 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300' },
    medium: { label: t('maturityMedium'), icon: '🌿', color: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300' },
    mature: { label: t('maturityMature'), icon: '🌳', color: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' },
  }

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
        {/* Levels info button */}
        <button
          onClick={() => setShowLevelsModal(true)}
          className="ml-auto px-3 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 hover:from-amber-200 hover:to-orange-200 dark:hover:from-amber-900/50 dark:hover:to-orange-900/50 transition-colors flex items-center gap-1.5"
        >
          <span>🏆</span>
          {t('maturityViewLevels')}
        </button>
      </div>

      {/* Teams list */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
          <div className="text-stone-400 dark:text-stone-500 text-5xl mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-200 mb-2">{t('teamsNoTeams')}</h3>
          <p className="text-stone-500 dark:text-stone-400 mb-6">{t('teamsNoTeamsMessage')}</p>
          <Link href="/teams/new">
            <Button>{t('teamsFirstTeam')}</Button>
          </Link>
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
                {/* Header: Name + badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {team.name}
                    </h3>
                    {/* Tool labels */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {team.tools_enabled.includes('pulse') && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded">
                          <span className="text-pink-500">♥</span> Pulse
                        </span>
                      )}
                      {team.tools_enabled.includes('delta') && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded">
                          <span className="font-bold">Δ</span> Delta
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Maturity badge */}
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded ${config.color}`}>
                      {config.icon}
                    </span>
                    {/* Attention indicator */}
                    {team.needs_attention && (
                      <span className="relative group/attention">
                        <span className="w-2 h-2 rounded-full bg-red-500 block" />
                        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs bg-stone-900 text-white rounded shadow-lg opacity-0 group-hover/attention:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {t('teamsAttentionTooltip')}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Score indicators with explanation */}
                <div className="flex items-center gap-3 mb-3">
                  {team.pulse?.average_score && (
                    <div className="flex items-center gap-1.5 group/score relative">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                        team.pulse.average_score >= 4 ? 'bg-green-500' :
                        team.pulse.average_score >= 3 ? 'bg-cyan-500' :
                        team.pulse.average_score >= 2 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}>
                        {team.pulse.average_score}
                      </div>
                      <span className="text-xs text-stone-400 dark:text-stone-500">Pulse</span>
                      <span className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs bg-stone-900 text-white rounded shadow-lg opacity-0 group-hover/score:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {team.pulse.average_score >= 4 ? t('scoreExcellent') :
                         team.pulse.average_score >= 3 ? t('scoreGood') :
                         team.pulse.average_score >= 2 ? t('scoreAverage') :
                         t('scoreLow')}
                      </span>
                    </div>
                  )}
                  {team.delta?.average_score && (
                    <div className="flex items-center gap-1.5 group/score relative">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                        team.delta.average_score >= 4 ? 'bg-green-500' :
                        team.delta.average_score >= 3 ? 'bg-cyan-500' :
                        team.delta.average_score >= 2 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}>
                        {team.delta.average_score}
                      </div>
                      <span className="text-xs text-stone-400 dark:text-stone-500">Delta</span>
                      <span className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs bg-stone-900 text-white rounded shadow-lg opacity-0 group-hover/score:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {team.delta.average_score >= 4 ? t('scoreExcellent') :
                         team.delta.average_score >= 3 ? t('scoreGood') :
                         team.delta.average_score >= 2 ? t('scoreAverage') :
                         t('scoreLow')}
                      </span>
                    </div>
                  )}
                  {!team.pulse?.average_score && !team.delta?.average_score && (
                    <span className="text-xs text-stone-400 dark:text-stone-500">{t('teamsNoData')}</span>
                  )}
                </div>

                {/* Participation progress (Pulse only) */}
                {team.pulse && (
                  <div className="mb-3">
                    {(() => {
                      const effectiveSize = team.expected_team_size || team.pulse.participant_count || 1
                      const todayCount = team.pulse.today_entries
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

                {/* Footer: Last activity */}
                <div className="text-xs text-stone-400 dark:text-stone-500 pt-2 border-t border-stone-100 dark:border-stone-700">
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
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">🏆 Team Niveaus</h2>
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
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{t('maturityBasic')}</span>
                  </div>
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
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌿</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{t('maturityMedium')}</span>
                  </div>
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
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌳</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{t('maturityMature')}</span>
                  </div>
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
                  href="mailto:expert@pinkpollos.nl?subject=Team Lab Premium Interest"
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
