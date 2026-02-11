'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import type { WowSessionWithStats, WowLevel } from '@/domain/wow/types'
import type { PublicWowStats } from '@/domain/metrics/public-actions'
import type { TeamMetrics } from '@/domain/metrics/types'
import type { SubscriptionTier } from '@/domain/billing/tiers'
import { isPaidTier } from '@/domain/billing/tiers'
import { RadarChart, type RadarAxis } from '@/components/ui/radar-chart'

interface WowSectionProps {
  teamId: string
  teamName: string
  teamPlan: string
  wowStats: { total_sessions: number; active_sessions: number; average_score: number | null; level: string } | null
  wowSessions: WowSessionWithStats[]
  angleLabels: Record<string, string>
  // Radar data
  radarWowStats?: PublicWowStats | null
  vibeMetrics?: TeamMetrics | null
  subscriptionTier?: SubscriptionTier
}

export function WowSection({ teamId, teamName, teamPlan, wowStats, wowSessions, angleLabels, radarWowStats, vibeMetrics, subscriptionTier = 'free' }: WowSectionProps) {
  const t = useTranslation()
  const [sessionsLevelTab, setSessionsLevelTab] = useState<WowLevel>((wowStats?.level as WowLevel) || 'shu')

  const [showWowFlow, setShowWowFlow] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('wow_flow_visible')
    return stored === null ? true : stored === 'true'
  })

  const toggleWowFlow = () => {
    setShowWowFlow(prev => {
      const next = !prev
      localStorage.setItem('wow_flow_visible', String(next))
      return next
    })
  }

  const currentTeamLevel = (wowStats?.level as WowLevel) || 'shu'
  const levelOrder: WowLevel[] = ['shu', 'ha', 'ri']
  const currentLevelIndex = levelOrder.indexOf(currentTeamLevel)

  const filteredSessions = wowSessions.filter(s => (s.level || 'shu') === sessionsLevelTab)

  const isPro = isPaidTier(subscriptionTier)

  const levelTabs: { id: WowLevel; kanji: string; label: string; locked: boolean; color: string; proLocked?: boolean }[] = [
    { id: 'shu', kanji: '守', label: 'Shu', locked: false, color: 'amber' },
    { id: 'ha', kanji: '破', label: 'Ha', locked: !isPro, color: 'cyan', proLocked: !isPro },
    { id: 'ri', kanji: '離', label: 'Ri', locked: !isPro, color: 'purple', proLocked: !isPro },
  ]

  // Build radar chart data
  const radarAxes: RadarAxis[] = []
  if (radarWowStats?.scoresByAngle) {
    for (const [angle, score] of Object.entries(radarWowStats.scoresByAngle)) {
      if (score !== null) {
        radarAxes.push({ key: angle, label: angleLabels[angle] || angle, value: score })
      }
    }
  }
  if (vibeMetrics?.weekVibe?.value) {
    radarAxes.push({ key: 'vibe', label: 'Vibe', value: vibeMetrics.weekVibe.value })
  }

  const showRadar = radarAxes.length >= 3
  const sorted = showRadar ? [...radarAxes].sort((a, b) => b.value - a.value) : []
  const strengths = sorted.slice(0, 2)
  const focusAreas = sorted.slice(-2).reverse()

  return (
    <div className="space-y-6 pt-3">
      {/* Title and flow explanation - collapsible */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            {t('wowFlowTitle')}
          </h2>
          <button
            onClick={toggleWowFlow}
            className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
            title={showWowFlow ? 'Hide flow' : 'Show flow'}
          >
            <svg
              className={`w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-transform ${
                showWowFlow ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="accordion-content" data-open={showWowFlow}>
          <div className="space-y-3">
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {t('wowFlowTagline')}
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {t('wowFlowExplanation')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[t('wowStep1'), t('wowStep2'), t('wowStep3'), t('wowStep4')].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-stone-700 dark:text-stone-300 leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions with Level Tabs */}
      <div className="bg-stone-50 dark:bg-stone-700/30 rounded-xl overflow-hidden">
        {/* Level Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-700">
          {levelTabs.map(tab => {
            const isActive = sessionsLevelTab === tab.id
            const colorClasses = {
              amber: isActive ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' : '',
              cyan: isActive ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' : '',
              purple: isActive ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' : '',
            }
            return (
              <button
                key={tab.id}
                onClick={() => !tab.locked && setSessionsLevelTab(tab.id)}
                disabled={tab.locked}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? colorClasses[tab.color as keyof typeof colorClasses]
                    : tab.locked
                      ? 'border-transparent text-stone-300 dark:text-stone-600 cursor-not-allowed'
                      : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                <span className="font-bold">{tab.kanji}</span>
                <span>{tab.label}</span>
                {tab.locked && (tab.proLocked
                  ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">Pro</span>
                  : <span className="text-xs">🔒</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Sessions for selected level */}
        <div className="divide-y divide-stone-100 dark:divide-stone-700">
          {filteredSessions.map(session => (
            <Link
              key={session.id}
              href={`/wow/session/${session.id}`}
              className="flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  session.status === 'active' ? 'bg-cyan-500' : 'bg-stone-400 dark:bg-stone-500'
                }`}>
                  {(angleLabels[session.angle] || session.angle).charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-stone-900 dark:text-stone-100">
                    {angleLabels[session.angle] || session.angle}
                  </div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">
                    {session.response_count} {t('responses')} · {session.status === 'active' ? t('active') : t('sessionsCompleted')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {session.overall_score && (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    session.overall_score >= 4 ? 'bg-green-500' :
                    session.overall_score >= 3 ? 'bg-cyan-500' :
                    session.overall_score >= 2 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}>
                    {session.overall_score.toFixed(1)}
                  </div>
                )}
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/30 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {session.status === 'active' ? t('open') : t('view')}
                </span>
              </div>
            </Link>
          ))}

          {/* Ghost "new session" tile */}
          <Link
            href={`/teams/${teamId}/wow/new`}
            className="flex items-center gap-3 p-4 group hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-stone-200 dark:border-stone-600 group-hover:border-cyan-400 dark:group-hover:border-cyan-600 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-cyan-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-stone-400 dark:text-stone-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {t('newSession')}
            </span>
          </Link>
        </div>
      </div>

      {/* Team Radar Chart */}
      {showRadar && (
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Left: title + scores */}
            <div className="sm:w-52 shrink-0 flex flex-col">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('teamHealthRadar')}</h3>

              <div className="space-y-3">
                {/* Strengths */}
                <div className="rounded-lg bg-green-50 dark:bg-green-900/15 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-green-600 dark:text-green-400 mb-1.5">{t('radarStrengths')}</div>
                  {strengths.map(s => (
                    <div key={s.key} className="flex items-center justify-between py-px">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-xs text-stone-700 dark:text-stone-300">{s.label}</span>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-green-700 dark:text-green-400">{s.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>

                {/* Focus areas */}
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/15 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 mb-1.5">{t('radarFocusAreas')}</div>
                  {focusAreas.map(s => (
                    <div key={s.key} className="flex items-center justify-between py-px">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-xs text-stone-700 dark:text-stone-300">{s.label}</span>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-amber-700 dark:text-amber-400">{s.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: radar chart centered */}
            <div className="flex-1 flex items-center justify-center">
              <RadarChart
                axes={radarAxes}
                size={400}
                teamName={teamName}
                tier={subscriptionTier}
                chartTitle="Way of Work Radar"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
