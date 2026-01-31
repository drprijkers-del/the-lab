'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TeamWithStats } from '@/domain/teams/actions'
import { DeltaSessionWithStats, getAngleInfo } from '@/domain/delta/types'
import { TeamStats } from '@/domain/delta/actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation, useLanguage, TranslationFunction } from '@/lib/i18n/context'

interface DeltaTeamContentProps {
  team: TeamWithStats
  sessions: DeltaSessionWithStats[]
  stats: TeamStats
  basePath: string // e.g., "/teams/123"
}

export function DeltaTeamContent({ team, sessions, stats, basePath }: DeltaTeamContentProps) {
  const t = useTranslation()
  const { language } = useLanguage()
  const dateLocale = language === 'nl' ? 'nl-NL' : 'en-US'

  const activeSessions = sessions.filter(s => s.status === 'active')
  const closedSessions = sessions.filter(s => s.status === 'closed')

  // Determine session link path - use /session/[id] for new structure
  const sessionBasePath = basePath.startsWith('/teams/') ? '/session' : '/delta/session'
  const newSessionPath = basePath.startsWith('/teams/') ? `${basePath}/delta/new` : `${basePath}/new`

  const getHealthColor = (score: number | null) => {
    if (score === null) return 'text-stone-400'
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-cyan-600'
    if (score >= 2) return 'text-amber-600'
    return 'text-red-600'
  }

  const getHealthBg = (score: number | null) => {
    if (score === null) return 'bg-stone-100'
    if (score >= 4) return 'bg-green-50'
    if (score >= 3) return 'bg-cyan-50'
    if (score >= 2) return 'bg-amber-50'
    return 'bg-red-50'
  }

  const getHealthLabel = (score: number | null) => {
    if (score === null) return '—'
    if (score >= 4) return language === 'nl' ? 'Gezond' : 'Healthy'
    if (score >= 3) return language === 'nl' ? 'Stabiel' : 'Stable'
    if (score >= 2) return language === 'nl' ? 'Aandacht' : 'Attention'
    return language === 'nl' ? 'Actie nodig' : 'Action needed'
  }

  const getTrendIcon = () => {
    if (stats.trend === 'up') {
      return (
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
    if (stats.trend === 'down') {
      return (
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    )
  }

  const getTrendLabel = () => {
    if (stats.trend === 'up') return t('trendUp')
    if (stats.trend === 'down') return t('trendDown')
    if (stats.trend === 'stable') return t('trendStable')
    return null
  }

  const formatTrendDrivers = () => {
    if (stats.trendDrivers.length === 0) return null
    const driverLabels = stats.trendDrivers.map(angle => getAngleInfo(angle as any).label)
    return `${t('trendDrivenBy')} ${driverLabels.join(', ')}`
  }

  return (
    <div>
      {/* Team header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{team.name}</h1>
        {team.description && (
          <p className="text-stone-500 dark:text-stone-400 mt-1">{team.description}</p>
        )}
        <p className="text-sm text-stone-400 dark:text-stone-500 mt-2">
          {t('adminCreatedOn')} {new Date(team.created_at).toLocaleDateString(dateLocale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* Team Health Overview */}
      {stats.totalSessions > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className={`${getHealthBg(stats.averageScore)} dark:bg-stone-800 border-0`}>
            <CardContent className="py-4">
              <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">{t('teamHealth')}</div>
              {stats.averageScore !== null ? (
                <>
                  <div className={`text-3xl font-bold ${getHealthColor(stats.averageScore)}`}>
                    {stats.averageScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">{getHealthLabel(stats.averageScore)}</div>
                </>
              ) : (
                <>
                  <div className="text-lg font-medium text-stone-400 dark:text-stone-500">{t('collecting')}</div>
                  <div className="text-xs text-stone-400 dark:text-stone-500 mt-1">{t('needsClosedSessions')}</div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-stone-50 dark:bg-stone-800 border-0">
            <CardContent className="py-4">
              <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">{t('trendLabel')}</div>
              {stats.trend ? (
                <>
                  <div className="flex items-center gap-1.5">
                    {getTrendIcon()}
                    <span className="text-lg font-medium text-stone-700 dark:text-stone-300">{getTrendLabel()}</span>
                  </div>
                  {stats.trendDrivers.length > 0 && (
                    <div className="text-xs text-stone-400 dark:text-stone-500 mt-1 truncate">{formatTrendDrivers()}</div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-lg font-medium text-stone-400 dark:text-stone-500">
                    {stats.closedSessions >= 2 ? t('trendStable') : t('needsMoreData')}
                  </div>
                  <div className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                    {stats.closedSessions < 2 ? t('needsTwoSessions') : ''}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-stone-50 dark:bg-stone-800 border-0">
            <CardContent className="py-4">
              <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">{t('sessions')}</div>
              <div className="text-3xl font-bold text-stone-700 dark:text-stone-200">
                {stats.closedSessions}
                <span className="text-lg text-stone-400 dark:text-stone-500">/{stats.totalSessions}</span>
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {stats.activeSessions > 0
                  ? `${stats.activeSessions} ${t('active').toLowerCase()}`
                  : t('sessionsCompleted')
                }
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stone-50 dark:bg-stone-800 border-0">
            <CardContent className="py-4">
              <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">{t('responses')}</div>
              <div className="text-3xl font-bold text-stone-700 dark:text-stone-200">{stats.totalResponses}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">{t('responsesCollected')}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Delta Session CTA */}
      <Card className="mb-8 border-cyan-200 dark:border-cyan-800 bg-gradient-to-r from-cyan-50 dark:from-cyan-900/30 to-white dark:to-stone-800">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{t('startDeltaSession')}</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400">{t('startDeltaSessionSubtitle')}</p>
            </div>
            <Link href={newSessionPath}>
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('newSession')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('activeSessions')}</h2>
          <div className="grid gap-4">
            {activeSessions.map(session => (
              <SessionCard key={session.id} session={session} t={t} sessionBasePath={sessionBasePath} />
            ))}
          </div>
        </div>
      )}

      {/* Session Diary */}
      {closedSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-stone-500 dark:text-stone-400 mb-2">{t('teamDiary')}</h2>
          <p className="text-sm text-stone-400 dark:text-stone-500 mb-4">{t('teamDiarySubtitle')}</p>
          {closedSessions.length >= 2 && (
            <div className="text-xs text-stone-400 dark:text-stone-500 mb-4 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('collectiveSignal')}
            </div>
          )}
          <div className="grid gap-4">
            {closedSessions.map(session => (
              <SessionCard key={session.id} session={session} t={t} sessionBasePath={sessionBasePath} />
            ))}
          </div>
        </div>
      )}

      {/* No sessions yet */}
      {sessions.length === 0 && (
        <Card className="mb-8">
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">{t('noSessionsYet')}</h3>
            <p className="text-stone-500 dark:text-stone-400 mb-6">{t('noSessionsMessage')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getCoachInsight(session: DeltaSessionWithStats, t: TranslationFunction): string | null {
  if (session.status === 'active') {
    if (session.response_count < 3) return t('insightWaitingForResults')
    return null
  }
  if (!session.overall_score || !session.focus_area) return null

  const angle = session.angle
  const score = session.overall_score

  if (score < 3) {
    switch (angle) {
      case 'flow': return t('insightFlowBlocked')
      case 'refinement': return t('insightRefinementWeak')
      case 'scrum': return t('insightScrumCeremonies')
      case 'ownership': return t('insightOwnershipWeak')
      case 'collaboration': return t('insightCollaborationTension')
      default: return t('insightUnplannedWork')
    }
  }

  if (score >= 4) {
    switch (angle) {
      case 'ownership': return t('insightOwnershipStrong')
      default: return t('insightGoodAlignment')
    }
  }

  return t('insightFocusSlicing')
}

function SessionCard({ session, t, sessionBasePath }: { session: DeltaSessionWithStats; t: TranslationFunction; sessionBasePath: string }) {
  const angleInfo = getAngleInfo(session.angle)
  const isActive = session.status === 'active'
  const isClosed = session.status === 'closed'
  const hasScore = session.overall_score !== null && session.overall_score !== undefined
  const insight = getCoachInsight(session, t)

  const getScoreBgColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) {
      return isActive ? 'bg-gradient-to-br from-cyan-400 to-cyan-600' : 'bg-stone-300'
    }
    if (score >= 4) return 'bg-green-500'
    if (score >= 3) return 'bg-cyan-500'
    if (score >= 2) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <Link href={`${sessionBasePath}/${session.id}`}>
      <Card className="card-hover cursor-pointer">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${getScoreBgColor(session.overall_score)}`}>
                {hasScore ? (
                  <span className="text-lg">{session.overall_score!.toFixed(1)}</span>
                ) : (
                  <span className="text-xl">{angleInfo.label.charAt(0)}</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                  {session.title || angleInfo.label}
                </h3>
                {isActive && (
                  <span className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded-full">
                    {t('active')}
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {angleInfo.label} • {session.response_count} {t('responses').toLowerCase()}
              </p>
              {insight && isClosed && (
                <p className="text-sm text-stone-400 dark:text-stone-500 mt-1 italic truncate">{insight}</p>
              )}
              {isClosed && session.focus_area && !insight && (
                <p className="text-sm text-stone-400 dark:text-stone-500 mt-1 truncate">
                  {t('focusArea')}: {session.focus_area}
                </p>
              )}
              {isActive && insight && (
                <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-1">{insight}</p>
              )}
            </div>

            <svg className="w-5 h-5 text-stone-400 dark:text-stone-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
