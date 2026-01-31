'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/context'
import type { TeamMetrics, PulseInsight } from '@/domain/metrics/types'
import {
  getZoneLabel,
  getZoneColor,
  getTrendArrow,
  getTrendColor,
  getConfidenceLabel,
  formatParticipationRate,
  getDayStateLabel,
  getWeekStateLabel,
  getMaturityLabel,
  getMaturityDescription,
  getMaturityColor,
} from '@/domain/metrics/calculations'

interface PulseMetricsProps {
  metrics: TeamMetrics
  insights: PulseInsight[]
}

type TimeView = 'live' | 'day' | 'week'

export function PulseMetrics({ metrics, insights }: PulseMetricsProps) {
  const { language } = useLanguage()
  const [activeView, setActiveView] = useState<TimeView>('week')

  const labels = {
    nl: {
      // Time views
      liveNow: 'Live',
      endOfDay: 'Gisteren',
      thisWeek: 'Deze week',
      // Context
      vsYesterday: 'vs gisteren',
      vsLastWeek: 'vs vorige week',
      // Participation
      participation: 'Deelname vandaag',
      of: 'van',
      checkedIn: 'ingecheckt',
      // States
      noData: 'Nog geen data',
      noDataDetail: 'Wacht op eerste check-ins...',
      notEnoughData: 'Onvoldoende data',
      notEnoughDetail: 'Minimaal 3 check-ins voor betrouwbare metrics.',
      // Insights
      signals: 'Signalen',
      // Momentum
      momentum: 'Momentum',
      days: 'dagen',
      rising: 'stijgend',
      declining: 'dalend',
      stable: 'stabiel',
    },
    en: {
      // Time views
      liveNow: 'Live',
      endOfDay: 'Yesterday',
      thisWeek: 'This week',
      // Context
      vsYesterday: 'vs yesterday',
      vsLastWeek: 'vs last week',
      // Participation
      participation: 'Participation today',
      of: 'of',
      checkedIn: 'checked in',
      // States
      noData: 'No data yet',
      noDataDetail: 'Waiting for first check-ins...',
      notEnoughData: 'Insufficient data',
      notEnoughDetail: 'Minimum 3 check-ins for reliable metrics.',
      // Insights
      signals: 'Signals',
      // Momentum
      momentum: 'Momentum',
      days: 'days',
      rising: 'rising',
      declining: 'declining',
      stable: 'stable',
    },
  }

  const t = labels[language]

  // No data at all
  if (metrics.participation.teamSize === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-5xl mb-4 opacity-30">⚗️</div>
          <h3 className="font-semibold text-stone-600 dark:text-stone-400 mb-2">{t.noData}</h3>
          <p className="text-sm text-stone-400 dark:text-stone-500">{t.noDataDetail}</p>
        </CardContent>
      </Card>
    )
  }

  // Not enough data for reliable metrics
  if (!metrics.hasEnoughData) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-4xl mb-4 opacity-40">📊</div>
          <h3 className="font-semibold text-stone-600 dark:text-stone-400 mb-2">{t.notEnoughData}</h3>
          <p className="text-sm text-stone-400 dark:text-stone-500 mb-4">{t.notEnoughDetail}</p>
          <ParticipationBar metrics={metrics} t={t} language={language} />
        </CardContent>
      </Card>
    )
  }

  // Get the active metric based on view
  const getActiveMetric = () => {
    switch (activeView) {
      case 'live':
        return {
          metric: metrics.livePulse,
          label: t.liveNow,
          context: t.vsYesterday,
          isLive: true,
        }
      case 'day':
        return {
          metric: metrics.dayPulse,
          label: t.endOfDay,
          context: null,
          isLive: false,
        }
      case 'week':
        return {
          metric: metrics.weekPulse,
          label: t.thisWeek,
          context: t.vsLastWeek,
          isLive: false,
        }
    }
  }

  const active = getActiveMetric()

  return (
    <div className="space-y-4">
      {/* Time view selector */}
      <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
        <TimeButton
          active={activeView === 'live'}
          onClick={() => setActiveView('live')}
          hasData={metrics.livePulse.value !== null}
          isLive
        >
          {t.liveNow}
        </TimeButton>
        <TimeButton
          active={activeView === 'day'}
          onClick={() => setActiveView('day')}
          hasData={metrics.dayPulse.value !== null}
        >
          {t.endOfDay}
        </TimeButton>
        <TimeButton
          active={activeView === 'week'}
          onClick={() => setActiveView('week')}
          hasData={metrics.weekPulse.value !== null}
        >
          {t.thisWeek}
        </TimeButton>
      </div>

      {/* Primary metric card - single focus */}
      <Card className="overflow-hidden">
        <CardContent className="py-8">
          <div className="text-center">
            {/* Time label */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {active.isLive && (
                <span className="inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              )}
              <span className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                {active.label}
              </span>
            </div>

            {active.metric.value !== null ? (
              <>
                {/* Zone badge - primary focus */}
                <div className={`inline-block px-6 py-3 rounded-2xl mb-4 ${getZoneColor(active.metric.zone)}`}>
                  <span className="text-xl font-bold">
                    {getZoneLabel(active.metric.zone, language)}
                  </span>
                </div>

                {/* Trend - prominent */}
                <div className={`flex items-center justify-center gap-2 mb-2 ${getTrendColor(active.metric.trend)}`}>
                  <span className="text-3xl font-bold">{getTrendArrow(active.metric.trend)}</span>
                  {active.metric.delta !== 0 && (
                    <span className="text-lg font-medium">
                      {active.metric.delta > 0 ? '+' : ''}{active.metric.delta.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Context */}
                {active.context && (
                  <p className="text-xs text-stone-400">{active.context}</p>
                )}

                {/* Confidence indicator */}
                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    active.metric.confidence === 'high'
                      ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
                      : active.metric.confidence === 'moderate'
                        ? 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                        : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  }`}>
                    {getConfidenceLabel(active.metric.confidence, language)}
                  </span>
                </div>
              </>
            ) : (
              <div className="py-4">
                <span className="text-2xl text-stone-300 dark:text-stone-600">—</span>
                <p className="text-sm text-stone-400 dark:text-stone-500 mt-2">{t.noData}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Momentum indicator */}
      {metrics.momentum.daysTrending > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500 dark:text-stone-400">{t.momentum}</span>
              <div className={`flex items-center gap-2 ${getTrendColor(metrics.momentum.direction)}`}>
                <span className="text-lg">{getTrendArrow(metrics.momentum.direction)}</span>
                <span className="text-sm font-medium">
                  {metrics.momentum.daysTrending} {t.days} {
                    metrics.momentum.direction === 'rising' ? t.rising :
                    metrics.momentum.direction === 'declining' ? t.declining : t.stable
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participation with day state */}
      <ParticipationBar metrics={metrics} t={t} language={language} />

      {/* Data maturity - progression indicator */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {language === 'nl' ? 'Signaal status' : 'Signal status'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${getMaturityColor(metrics.maturity.level)}`}>
              {getMaturityLabel(metrics.maturity.level, language)}
            </span>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
            {getMaturityDescription(metrics.maturity.level, metrics.maturity.daysOfData, language)}
          </p>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">{t.signals}</h3>
            <div className="space-y-3">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} language={language} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Time view button
function TimeButton({
  children,
  active,
  onClick,
  hasData,
  isLive,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  hasData: boolean
  isLive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all min-h-11
        ${active
          ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
          : hasData
            ? 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            : 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
        }
        ${isLive && hasData ? 'flex items-center justify-center gap-1.5' : ''}
      `}
      disabled={!hasData}
    >
      {isLive && hasData && (
        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
      )}
      {children}
    </button>
  )
}

// Participation progress bar with day state
function ParticipationBar({
  metrics,
  t,
  language,
}: {
  metrics: TeamMetrics
  t: Record<string, string>
  language: 'nl' | 'en'
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-stone-500 dark:text-stone-400">{t.participation}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            metrics.dayState === 'day_complete'
              ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
              : metrics.dayState === 'signal_emerging'
                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
          }`}>
            {getDayStateLabel(metrics.dayState, language)}
          </span>
        </div>
        <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              metrics.participation.rate >= 60
                ? 'bg-cyan-500'
                : metrics.participation.rate >= 30
                  ? 'bg-amber-400'
                  : 'bg-stone-300 dark:bg-stone-500'
            }`}
            style={{ width: `${Math.min(metrics.participation.rate, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-stone-400 dark:text-stone-500">
            {formatParticipationRate(metrics.participation.today, metrics.participation.teamSize)}
          </span>
          <span className="text-xs text-stone-400 dark:text-stone-500">
            {metrics.participation.today}/{metrics.participation.teamSize}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// Insight card
function InsightCard({ insight, language }: { insight: PulseInsight; language: 'nl' | 'en' }) {
  const severityStyles = {
    info: 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800',
    attention: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30',
    warning: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30',
  }

  const severityIcons = {
    info: '💡',
    attention: '⚡',
    warning: '⚠️',
  }

  const checkLabel = language === 'nl' ? 'Wat je zou kunnen checken' : 'What you could check'

  return (
    <div className={`rounded-xl border p-3 ${severityStyles[insight.severity]}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm" aria-hidden="true">{severityIcons[insight.severity]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{insight.message}</p>
          {insight.detail && (
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">{insight.detail}</p>
          )}
          {insight.suggestions && insight.suggestions.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-cyan-600 dark:text-cyan-400 cursor-pointer hover:text-cyan-700 dark:hover:text-cyan-300 min-h-11 flex items-center">
                {checkLabel}
              </summary>
              <ul className="mt-2 text-xs text-stone-600 dark:text-stone-400 space-y-1 pl-4">
                {insight.suggestions.map((s, i) => (
                  <li key={i} className="list-disc">{s}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
