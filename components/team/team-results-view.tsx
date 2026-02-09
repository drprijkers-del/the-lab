'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation, useLanguage } from '@/lib/i18n/context'
import { getPublicTeamMetrics, getPublicVibeHistory, getPublicWowStats, getCoachQuestion, getResultsShareUrl, type PublicWowStats } from '@/domain/metrics/public-actions'
import { RadarChart, type RadarAxis } from '@/components/ui/radar-chart'
import type { TeamMetrics, DailyVibe } from '@/domain/metrics/types'

const ANGLE_LABELS: Record<string, string> = {
  scrum: 'Scrum',
  flow: 'Flow',
  ownership: 'Ownership',
  collaboration: 'Collaboration',
  technical_excellence: 'Tech Excellence',
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

const LEVEL_INFO: Record<string, { kanji: string; label: string; color: string; gradient: string; subtitle: string; bannerKey: string }> = {
  shu: { kanji: '守', label: 'Shu', color: 'bg-cyan-500', gradient: 'from-amber-500 to-orange-600', subtitle: 'shuDescription', bannerKey: 'levelBannerShu' },
  ha: { kanji: '破', label: 'Ha', color: 'bg-amber-500', gradient: 'from-cyan-500 to-blue-600', subtitle: 'haDescription', bannerKey: 'levelBannerHa' },
  ri: { kanji: '離', label: 'Ri', color: 'bg-purple-500', gradient: 'from-purple-500 to-indigo-600', subtitle: 'riDescription', bannerKey: 'levelBannerRi' },
}

interface TeamResultsViewProps {
  teamName: string
  teamSlug: string
  teamId?: string // Optional: passed when admin accesses directly (bypasses cookie)
}

// Simple sparkline chart component
function SparklineChart({ data }: { data: DailyVibe[] }) {
  if (data.length < 2) return null

  const values = data.map(d => d.average)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const width = 280
  const height = 60
  const padding = 4

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2)
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  const lastValue = values[values.length - 1]
  const trend = values.length >= 2 ? lastValue - values[values.length - 2] : 0

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        <line x1={padding} y1={height/2} x2={width-padding} y2={height/2}
              stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4" />

        {/* Area fill */}
        <polygon
          points={`${padding},${height-padding} ${points} ${width-padding},${height-padding}`}
          className="fill-cyan-500/10"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-cyan-500"
        />

        {/* End dot */}
        <circle
          cx={width - padding}
          cy={height - padding - ((lastValue - min) / range) * (height - padding * 2)}
          r="4"
          className={trend >= 0 ? 'fill-green-500' : 'fill-amber-500'}
        />
      </svg>
    </div>
  )
}

// Zone indicator component
function ZoneIndicator({ zone, value }: { zone: string | null; value: number | null }) {
  const t = useTranslation()

  const zoneConfig = {
    high_confidence: { color: 'bg-green-500', label: t('resultsZoneHigh') },
    steady_state: { color: 'bg-cyan-500', label: t('resultsZoneSteady') },
    mixed_signals: { color: 'bg-amber-500', label: t('resultsZoneMixed') },
    under_pressure: { color: 'bg-red-500', label: t('resultsZonePressure') },
  }

  const config = zone ? zoneConfig[zone as keyof typeof zoneConfig] : null

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${config?.color || 'bg-stone-300'}`} />
      <div>
        <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
          {value !== null ? value.toFixed(1) : '–'}
        </div>
        <div className="text-sm text-stone-500 dark:text-stone-400">
          {config?.label || t('resultsNoData')}
        </div>
      </div>
    </div>
  )
}

export function TeamResultsView({ teamName, teamSlug, teamId }: TeamResultsViewProps) {
  const t = useTranslation()
  const { language } = useLanguage()
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null)
  const [history, setHistory] = useState<DailyVibe[]>([])
  const [wow, setWow] = useState<PublicWowStats | null>(null)
  const [coachQuestion, setCoachQuestion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsResult, historyData, wowData, question] = await Promise.all([
          getPublicTeamMetrics(teamId),
          getPublicVibeHistory(teamId),
          getPublicWowStats(teamId),
          getCoachQuestion(language as 'nl' | 'en', teamId),
        ])

        if (metricsResult.error) {
          setError(metricsResult.error)
        } else {
          setMetrics(metricsResult.metrics)
        }
        setHistory(historyData)
        setWow(wowData)
        setCoachQuestion(question)
      } catch {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [language])

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-800 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">{t('loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-stone-500 dark:text-stone-400 mb-4">{t('resultsError')}</div>
          <Link href={`/vibe/t/${teamSlug}`} className="text-cyan-600 hover:underline">
            {t('resultsGoToCheckin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border-b border-stone-200 dark:border-stone-700 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-stone-900 dark:text-stone-100">{teamName}</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">{t('resultsTitle')}</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Share button (admin only) */}
            {teamId && (
              <button
                onClick={async () => {
                  setShareLoading(true)
                  const url = await getResultsShareUrl(teamId)
                  setShareLoading(false)
                  if (url) {
                    navigator.clipboard.writeText(url)
                    setShareCopied(true)
                    setTimeout(() => setShareCopied(false), 2000)
                  }
                }}
                disabled={shareLoading}
                className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                title={t('shareCopy')}
              >
                {shareCopied ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : shareLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                )}
              </button>
            )}
            {/* Check-in link */}
            <Link
              href={`/vibe/t/${teamSlug}`}
              className="px-3 py-1.5 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
            >
              {t('resultsCheckin')}
            </Link>
            {/* Close button - admin goes to team detail, others go to check-in */}
            <Link
              href={teamId ? `/teams/${teamId}` : `/vibe/t/${teamSlug}`}
              className="p-2 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              title={t('closePage')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Shu/Ha/Ri Level Banner */}
        {wow && (() => {
          const level = LEVEL_INFO[wow.level]
          if (!level) return null
          return (
            <div className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${level.gradient} p-6 text-white shadow-lg`}>
              {/* Large kanji background watermark */}
              <div className="absolute -right-4 -top-4 text-[120px] font-bold leading-none opacity-15 select-none pointer-events-none">
                {level.kanji}
              </div>
              <div className="relative">
                <div className="text-xs font-medium uppercase tracking-widest opacity-80 mb-2">{t('levelBannerTitle')}</div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl font-bold">{level.kanji}</span>
                  <div>
                    <div className="text-2xl font-bold">{level.label}</div>
                    <div className="text-sm opacity-90">{t(level.subtitle as never)}</div>
                  </div>
                </div>
                <p className="text-sm opacity-80 leading-relaxed mt-2">{t(level.bannerKey as never)}</p>
              </div>
            </div>
          )
        })()}

        {/* Pulse Labs branding */}
        <div className="flex items-center justify-center gap-2">
          <svg className="w-7 h-7" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="url(#plRippleR)" strokeWidth="2" fill="none" opacity="0.4" />
            <circle cx="32" cy="32" r="20" stroke="url(#plRippleR)" strokeWidth="2.5" fill="none" opacity="0.6" />
            <circle cx="32" cy="32" r="12" stroke="url(#plRippleR)" strokeWidth="3" fill="none" opacity="0.85" />
            <circle cx="32" cy="32" r="5" fill="url(#plDropR)" />
            <defs>
              <linearGradient id="plDropR" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="plRippleR" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm text-stone-700 dark:text-stone-200">Pulse</span>
            <span className="text-[7px] font-medium text-stone-400 dark:text-stone-400 uppercase tracking-widest -mt-0.5">Labs</span>
          </div>
        </div>

        {/* Coach Question */}
        {coachQuestion && (
          <div className="bg-linear-to-br from-cyan-50 to-purple-50 dark:from-cyan-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium text-cyan-600 dark:text-cyan-400 mb-1">{t('resultsCoachQuestion')}</div>
                <p className="text-stone-900 dark:text-stone-100 font-medium">{coachQuestion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Week Pulse Card */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-5 shadow-sm border border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900 dark:text-stone-100">{t('resultsWeekPulse')}</h2>
            {metrics?.weekVibe.trend && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                metrics.weekVibe.trend === 'rising'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : metrics.weekVibe.trend === 'declining'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
              }`}>
                {metrics.weekVibe.trend === 'rising' ? '↑' : metrics.weekVibe.trend === 'declining' ? '↓' : '→'} {
                  metrics.weekVibe.trend === 'rising' ? t('resultsTrendRising') :
                  metrics.weekVibe.trend === 'declining' ? t('resultsTrendDeclining') :
                  t('resultsTrendStable')
                }
              </span>
            )}
          </div>

          <ZoneIndicator zone={metrics?.weekVibe.zone || null} value={metrics?.weekVibe.value || null} />

          {/* Sparkline */}
          {history.length >= 2 && (
            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
              <div className="text-xs text-stone-400 mb-2">{t('resultsLast14Days')}</div>
              <SparklineChart data={history.slice(-14)} />
              <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>{history.length >= 14 ? formatDate(history[history.length - 14]?.date || '') : formatDate(history[0]?.date || '')}</span>
                <span>{formatDate(history[history.length - 1]?.date || '')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Today's Pulse */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-5 shadow-sm border border-stone-200 dark:border-stone-700">
          <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('resultsTodayPulse')}</h2>

          <div className="flex items-center justify-between">
            <ZoneIndicator zone={metrics?.liveVibe.zone || null} value={metrics?.liveVibe.value || null} />

            <div className="text-right">
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {metrics?.participation.today || 0}
                <span className="text-sm font-normal text-stone-400">/{metrics?.participation.teamSize || 0}</span>
              </div>
              <div className="text-sm text-stone-500 dark:text-stone-400">{t('resultsCheckins')}</div>
            </div>
          </div>
        </div>

        {/* Momentum */}
        {metrics?.momentum && metrics.hasEnoughData && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-5 shadow-sm border border-stone-200 dark:border-stone-700">
            <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('resultsMomentum')}</h2>

            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                metrics.momentum.direction === 'rising'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : metrics.momentum.direction === 'declining'
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-stone-100 dark:bg-stone-700'
              }`}>
                <svg
                  className={`w-6 h-6 ${
                    metrics.momentum.direction === 'rising'
                      ? 'text-green-600 dark:text-green-400 -rotate-45'
                      : metrics.momentum.direction === 'declining'
                      ? 'text-amber-600 dark:text-amber-400 rotate-45'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {metrics.momentum.direction === 'stable' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
                  )}
                </svg>
              </div>
              <div>
                <div className="font-medium text-stone-900 dark:text-stone-100">
                  {metrics.momentum.direction === 'rising' ? t('resultsMomentumRising') :
                   metrics.momentum.direction === 'declining' ? t('resultsMomentumDeclining') :
                   t('resultsMomentumStable')}
                </div>
                <div className="text-sm text-stone-500 dark:text-stone-400">
                  {metrics.momentum.daysTrending} {t('resultsDays')} • {
                    metrics.momentum.velocity === 'slow' ? t('resultsMomentumVelocitySlow') :
                    metrics.momentum.velocity === 'fast' ? t('resultsMomentumVelocityFast') :
                    t('resultsMomentumVelocityModerate')
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Radar Chart */}
        {(() => {
          const radarAxes: RadarAxis[] = []
          if (wow?.scoresByAngle) {
            for (const [angle, score] of Object.entries(wow.scoresByAngle)) {
              if (score !== null) {
                radarAxes.push({ key: angle, label: ANGLE_LABELS[angle] || angle, value: score })
              }
            }
          }
          if (metrics?.weekVibe?.value) {
            radarAxes.push({ key: 'vibe', label: 'Vibe', value: metrics.weekVibe.value })
          }
          if (radarAxes.length < 3) return null

          const sorted = [...radarAxes].sort((a, b) => b.value - a.value)
          const strengths = sorted.slice(0, 2)
          const focusAreas = sorted.slice(-2).reverse()

          return (
            <div className="bg-white dark:bg-stone-800 rounded-2xl p-5 shadow-sm border border-stone-200 dark:border-stone-700">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">{t('teamHealthRadar')}</h2>

              {/* Strengths + Focus cards */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg bg-green-50 dark:bg-green-900/15 px-2.5 py-1.5">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-green-600 dark:text-green-400 mb-1">{t('radarStrengths')}</div>
                  {strengths.map(s => (
                    <div key={s.key} className="flex items-center justify-between py-px">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-green-500" />
                        <span className="text-[11px] text-stone-700 dark:text-stone-300">{s.label}</span>
                      </div>
                      <span className="text-[11px] font-bold tabular-nums text-green-700 dark:text-green-400">{s.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/15 px-2.5 py-1.5">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 mb-1">{t('radarFocusAreas')}</div>
                  {focusAreas.map(s => (
                    <div key={s.key} className="flex items-center justify-between py-px">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-amber-500" />
                        <span className="text-[11px] text-stone-700 dark:text-stone-300">{s.label}</span>
                      </div>
                      <span className="text-[11px] font-bold tabular-nums text-amber-700 dark:text-amber-400">{s.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <RadarChart axes={radarAxes} size={320} />
            </div>
          )
        })()}

        {/* Way of Work Section */}
        {wow && (wow.closedSessions > 0 || wow.activeSessions.length > 0) && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-5 shadow-sm border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-stone-900 dark:text-stone-100">{t('resultsWow')}</h2>
                {/* Shu-Ha-Ri Level Badge */}
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${LEVEL_INFO[wow.level].color} bg-opacity-20`}>
                  <span className="text-sm font-bold">{LEVEL_INFO[wow.level].kanji}</span>
                  <span className="text-xs font-medium">{LEVEL_INFO[wow.level].label}</span>
                </div>
              </div>
              {wow.closedSessions > 0 && (
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {wow.closedSessions} {t('resultsSessions')}
                </span>
              )}
            </div>

            {/* Active Sessions - Join CTA */}
            {wow.activeSessions.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">{t('resultsActiveSessions')}</div>
                <div className="space-y-2">
                  {wow.activeSessions.map((session) => (
                    <a
                      key={session.id}
                      href={`/d/${session.sessionCode}`}
                      className="flex items-center justify-between p-2 bg-white dark:bg-stone-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        {ANGLE_LABELS[session.angle] || session.angle}
                      </span>
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        {t('resultsJoinSession')} →
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Average Score */}
            {wow.averageScore !== null && (
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${
                  wow.averageScore >= 3.5 ? 'bg-green-500' :
                  wow.averageScore >= 2.5 ? 'bg-cyan-500' :
                  'bg-amber-500'
                }`} />
                <div>
                  <div className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-100">
                    {wow.averageScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">
                    {t('resultsWowAvg')}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Sessions */}
            {wow.recentSessions.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-stone-100 dark:border-stone-700">
                <div className="text-xs text-stone-400 mb-2">{t('resultsRecentSessions')}</div>
                {wow.recentSessions.map((session, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        {ANGLE_LABELS[session.angle] || session.angle}
                      </span>
                      <span className="text-xs text-stone-400">
                        {session.responseCount} {t('responses')}
                      </span>
                    </div>
                    {session.score !== null ? (
                      <span className={`text-sm font-semibold tabular-nums ${
                        session.score >= 3.5 ? 'text-green-600 dark:text-green-400' :
                        session.score >= 2.5 ? 'text-cyan-600 dark:text-cyan-400' :
                        'text-amber-600 dark:text-amber-400'
                      }`}>
                        {session.score.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">–</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Data maturity info */}
        {!metrics?.hasEnoughData && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium text-amber-900 dark:text-amber-200">{t('resultsGatheringData')}</div>
                <div className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                  {t('resultsGatheringDataDetail')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Check-in CTA */}
        <div className="text-center pt-4">
          <Link
            href={`/vibe/t/${teamSlug}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('resultsAddCheckin')}
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-stone-400">
            {t('resultsPoweredBy')} <span className="font-semibold">Pulse Labs</span>
          </p>
        </div>
      </main>
    </div>
  )
}
