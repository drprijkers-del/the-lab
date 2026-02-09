'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UnifiedTeam } from '@/domain/teams/actions'
import { type TeamOwner } from '@/app/teams/page'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'

interface TeamsListContentProps {
  teams: UnifiedTeam[]
  owners?: TeamOwner[]
  userRole?: 'super_admin' | 'scrum_master'
  currentUserId?: string
}

type FilterType = 'all' | 'needs_attention'

export function TeamsListContent({ teams, owners = [], userRole, currentUserId }: TeamsListContentProps) {
  const t = useTranslation()
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedOwner, setSelectedOwner] = useState<string>(currentUserId ?? 'all')
  const [showPreview, setShowPreview] = useState(false)
  const [showResultPreview, setShowResultPreview] = useState(false)

  const filteredTeams = teams.filter(team => {
    if (filter === 'needs_attention' && !team.needs_attention) return false
    if (selectedOwner !== 'all' && team.owner_id !== selectedOwner) return false
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
    if (diffDays === 1) return t('timeYesterday')
    if (diffDays < 7) return t('timeDaysAgo').replace('{n}', String(diffDays))
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
            onClick={() => {
              setFilter(key)
              if (key === 'all') setSelectedOwner('all')
            }}
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

        {/* Account filter dropdown - super admins only */}
        {userRole === 'super_admin' && owners.length > 0 && (
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="px-3 py-2 rounded-full text-sm font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-0 outline-none cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            <option value="all">{t('teamsFilterAllAccounts')}</option>
            {owners.map(owner => {
              const count = teams.filter(t => t.owner_id === owner.id).length
              return (
                <option key={owner.id} value={owner.id}>
                  {owner.email} ({count})
                </option>
              )
            })}
          </select>
        )}
      </div>

      {/* Teams list */}
      {filteredTeams.length === 0 ? (
        filter === 'needs_attention' && teams.length > 0 ? (
          /* Positive message when no teams need attention */
          <div className="bg-linear-to-br from-green-50 to-emerald-50/30 dark:from-stone-800 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-8 sm:p-12">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                {t('teamsAllGood')}
              </h3>
              <p className="text-stone-500 dark:text-stone-400">
                {t('teamsAllGoodMessage')}
              </p>
            </div>
          </div>
        ) : (
        <div className="bg-linear-to-br from-stone-50 to-cyan-50/30 dark:from-stone-800 dark:to-cyan-900/20 rounded-2xl border border-stone-200 dark:border-stone-700 p-8 sm:p-12">
          <div className="max-w-lg mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                {t('teamsNoTeams')}
              </h3>
              <p className="text-stone-500 dark:text-stone-400">
                {t('teamsNoTeamsMessage')}
              </p>
            </div>

            {/* Onboarding steps */}
            <div className="space-y-4 mb-8">
              {/* Step 1 */}
              <div className="flex items-start gap-4 bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700">
                <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-cyan-700 dark:text-cyan-400">1</div>
                <div>
                  <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('onboardingStep1Title')}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('onboardingStep1Desc')}</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4 bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700">
                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-pink-700 dark:text-pink-400">2</div>
                <div>
                  <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('onboardingStep2Title')}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('onboardingStep2Desc')}</div>
                </div>
              </div>

              {/* Step 3 — WoW angle output preview */}
              <div>
                <div className={`flex items-start gap-4 bg-white dark:bg-stone-800 p-4 border border-stone-200 dark:border-stone-700 transition-[border-radius] duration-200 ${showPreview ? 'rounded-t-xl rounded-b-none border-b-purple-300 dark:border-b-purple-700' : 'rounded-xl'}`}>
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-purple-700 dark:text-purple-400">3</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('onboardingStep3Title')}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('onboardingStep3Desc')}</div>
                    <button
                      onClick={() => setShowPreview(v => !v)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                      <svg className={`w-3 h-3 transition-transform duration-200 ${showPreview ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {t('onboardingShowPreview')}
                    </button>
                  </div>
                </div>

                {/* Collapsible angle output preview — attached to step card */}
                <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: showPreview ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <div className="relative bg-stone-50 dark:bg-stone-800/50 rounded-b-xl border border-t-0 border-purple-300 dark:border-purple-700 border-dashed overflow-hidden">
                      {/* PREVIEW badge */}
                      <div className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-[9px] font-bold rounded-full uppercase tracking-wider">
                        Preview
                      </div>

                      {/* Angle header */}
                      <div className="px-3 pt-3 pb-2 border-b border-stone-100 dark:border-stone-700">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500 text-white flex items-center justify-center font-bold text-sm">3.6</div>
                          <div>
                            <div className="text-sm font-bold text-stone-900 dark:text-stone-100">Scrum</div>
                            <div className="text-[10px] text-stone-400">6 {t('resultsResponses')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Statement scores with distribution bars */}
                      <div className="p-3 space-y-2.5">
                        {[
                          { score: 4.2, text: 'We have a clear Definition of Done', dist: [0, 0, 1, 3, 2], tag: 'strength' },
                          { score: 3.8, text: 'Our standups are focused and short', dist: [0, 1, 1, 2, 2], tag: null },
                          { score: 3.5, text: 'We refine stories before sprint start', dist: [0, 1, 2, 2, 1], tag: null },
                          { score: 2.8, text: 'We finish what we start each sprint', dist: [1, 1, 2, 2, 0], tag: 'tension' },
                        ].map((stmt, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                              stmt.score >= 4 ? 'bg-green-500' : stmt.score >= 3 ? 'bg-cyan-500' : 'bg-amber-500'
                            }`}>
                              {stmt.score}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-tight">{stmt.text}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                {/* Mini distribution bars */}
                                <div className="flex items-end gap-px h-3">
                                  {stmt.dist.map((count, j) => (
                                    <div
                                      key={j}
                                      className={`w-1.5 rounded-t-sm ${
                                        j <= 1 ? 'bg-red-400' : j === 2 ? 'bg-amber-400' : 'bg-green-400'
                                      }`}
                                      style={{ height: `${Math.max(2, (count / 3) * 12)}px` }}
                                    />
                                  ))}
                                </div>
                                {stmt.tag && (
                                  <span className={`text-[8px] font-medium px-1 py-0.5 rounded ${
                                    stmt.tag === 'strength'
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                  }`}>
                                    {stmt.tag === 'strength' ? '✓ Strength' : '↗ Focus'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="px-3 pb-2.5">
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 italic text-center">{t('onboardingPreviewAngleHint')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 — Result report preview */}
              <div>
                <div className={`flex items-start gap-4 bg-white dark:bg-stone-800 p-4 border border-stone-200 dark:border-stone-700 transition-[border-radius] duration-200 ${showResultPreview ? 'rounded-t-xl rounded-b-none border-b-emerald-300 dark:border-b-emerald-700' : 'rounded-xl'}`}>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-700 dark:text-emerald-400">4</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('onboardingStep4Title')}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('onboardingStep4Desc')}</div>
                    <button
                      onClick={() => setShowResultPreview(v => !v)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      <svg className={`w-3 h-3 transition-transform duration-200 ${showResultPreview ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {t('onboardingShowPreview')}
                    </button>
                  </div>
                </div>

                {/* Collapsible result report preview — attached to step card */}
                <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: showResultPreview ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <div className="relative bg-stone-50 dark:bg-stone-800/50 rounded-b-xl border border-t-0 border-emerald-300 dark:border-emerald-700 border-dashed overflow-hidden">
                      {/* PREVIEW badge */}
                      <div className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold rounded-full uppercase tracking-wider">
                        Preview
                      </div>

                      {/* Shu banner */}
                      <div className="relative overflow-hidden bg-linear-to-br from-amber-500 to-orange-600 px-3 py-2 text-white">
                        <div className="absolute -right-1 -top-1 text-[40px] font-bold leading-none opacity-15 select-none">守</div>
                        <div className="relative flex items-center gap-2">
                          <span className="text-lg font-bold">守</span>
                          <div>
                            <div className="text-xs font-bold">Shu</div>
                            <div className="text-[9px] opacity-80">{t('onboardingPreviewLevel')}</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 space-y-3">
                        {/* Vibe score + sparkline */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            <span className="text-base font-bold text-stone-900 dark:text-stone-100">3.8</span>
                            <span className="text-[10px] text-stone-400">{t('onboardingPreviewVibe')}</span>
                          </div>
                          <div className="flex-1 h-6">
                            <svg viewBox="0 0 200 24" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                              <polyline points="0,18 30,16 60,20 90,12 120,14 150,8 180,10 200,6" fill="none" className="text-cyan-500" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>

                        {/* Mini radar/spider chart */}
                        <div className="flex justify-center">
                          <svg viewBox="0 0 160 130" className="w-40 h-32">
                            <polygon points="80,27 116,53 102,96 58,96 44,53" fill="none" stroke="currentColor" className="text-stone-300 dark:text-stone-600" strokeWidth="0.75" opacity="0.5" />
                            <polygon points="80,46 98,59 91,80 69,80 62,59" fill="none" stroke="currentColor" className="text-stone-300 dark:text-stone-600" strokeWidth="0.75" opacity="0.3" />
                            <line x1="80" y1="65" x2="80" y2="27" stroke="currentColor" className="text-stone-300 dark:text-stone-600" strokeWidth="0.5" opacity="0.3" />
                            <line x1="80" y1="65" x2="116" y2="53" stroke="currentColor" className="text-stone-300 dark:text-stone-600" strokeWidth="0.5" opacity="0.3" />
                            <line x1="80" y1="65" x2="102" y2="96" stroke="currentColor" className="text-stone-300 dark:text-stone-600" strokeWidth="0.5" opacity="0.3" />
                            <line x1="80" y1="65" x2="58" y2="96" stroke="currentColor" className="text-stone-300 dark:text-stone-600" strokeWidth="0.5" opacity="0.3" />
                            <line x1="80" y1="65" x2="44" y2="53" stroke="currentColor" className="text-stone-300 dark:text-stone-600" strokeWidth="0.5" opacity="0.3" />
                            <polygon points="80,40 100,59 96,87 67,83 62,59" fill="currentColor" className="text-cyan-500" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                            <circle cx="80" cy="40" r="2.5" className="fill-cyan-500" />
                            <circle cx="100" cy="59" r="2.5" className="fill-cyan-500" />
                            <circle cx="96" cy="87" r="2.5" className="fill-cyan-500" />
                            <circle cx="67" cy="83" r="2.5" className="fill-cyan-500" />
                            <circle cx="62" cy="59" r="2.5" className="fill-cyan-500" />
                            <text x="80" y="17" textAnchor="middle" className="fill-stone-500 dark:fill-stone-400" fontSize="7.5" fontWeight="600">Scrum</text>
                            <text x="80" y="24" textAnchor="middle" className="fill-cyan-600 dark:fill-cyan-400" fontSize="7" fontWeight="700">3.6</text>
                            <text x="126" y="51" textAnchor="start" className="fill-stone-500 dark:fill-stone-400" fontSize="7.5" fontWeight="600">Flow</text>
                            <text x="126" y="58" textAnchor="start" className="fill-cyan-600 dark:fill-cyan-400" fontSize="7" fontWeight="700">3.2</text>
                            <text x="110" y="105" textAnchor="start" className="fill-stone-500 dark:fill-stone-400" fontSize="7.5" fontWeight="600">Ownership</text>
                            <text x="110" y="112" textAnchor="start" className="fill-cyan-600 dark:fill-cyan-400" fontSize="7" fontWeight="700">3.8</text>
                            <text x="50" y="105" textAnchor="end" className="fill-stone-500 dark:fill-stone-400" fontSize="7.5" fontWeight="600">Collab</text>
                            <text x="50" y="112" textAnchor="end" className="fill-cyan-600 dark:fill-cyan-400" fontSize="7" fontWeight="700">3.4</text>
                            <text x="34" y="51" textAnchor="end" className="fill-stone-500 dark:fill-stone-400" fontSize="7.5" fontWeight="600">Refinement</text>
                            <text x="34" y="58" textAnchor="end" className="fill-cyan-600 dark:fill-cyan-400" fontSize="7" fontWeight="700">3.0</text>
                          </svg>
                        </div>

                        {/* Strengths & Focus areas */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800">
                            <div className="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">{t('resultsStrengths')}</div>
                            <div className="space-y-0.5">
                              <div className="text-[10px] text-stone-700 dark:text-stone-300 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-green-500" />Ownership
                              </div>
                              <div className="text-[10px] text-stone-700 dark:text-stone-300 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-green-500" />Scrum
                              </div>
                            </div>
                          </div>
                          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-200 dark:border-amber-800">
                            <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">{t('resultsFocusAreas')}</div>
                            <div className="space-y-0.5">
                              <div className="text-[10px] text-stone-700 dark:text-stone-300 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-amber-500" />Refinement
                              </div>
                              <div className="text-[10px] text-stone-700 dark:text-stone-300 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-amber-500" />Flow
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Coach question */}
                        <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-2 border border-cyan-200 dark:border-cyan-800">
                          <div className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400 mb-0.5">{t('onboardingPreviewCoach')}</div>
                          <p className="text-[11px] text-stone-700 dark:text-stone-300 italic">{t('onboardingPreviewQuestion')}</p>
                        </div>

                        <p className="text-[10px] text-stone-400 dark:text-stone-500 italic text-center">{t('onboardingPreviewHint')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
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
        </div>
        )
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
                    {/* Tool labels */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {team.tools_enabled.includes('vibe') && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded">
                          Vibe
                        </span>
                      )}
                      {team.tools_enabled.includes('wow') && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded">
                          <span className="sm:hidden">WoW</span>
                          <span className="hidden sm:inline">Way of Work</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Shu-Ha-Ri level badge */}
                  {levelConfig && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded ${levelConfig.color}`}>
                        <span className="font-bold">{levelConfig.kanji}</span>
                        <span className="hidden sm:inline">{levelConfig.label}</span>
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

                {/* Footer: Last activity */}
                <div className="text-xs text-stone-400 dark:text-stone-500 pt-2 border-t border-stone-100 dark:border-stone-700">
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
