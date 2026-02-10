'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { type WowLevel, WOW_LEVELS } from '@/domain/wow/types'

interface OverallSignalProps {
  teamId: string
  teamName: string
  needsAttention?: boolean
  vibeScore: number | null
  wowScore: number | null
  vibeParticipation: number // percentage 0-100
  wowSessions: number
  wowLevel?: WowLevel | null
  activeTab?: string
  // Optional vibe context (only shown when on Vibe tab)
  vibeMessage?: string | null
  vibeSuggestion?: string | null
  vibeWowHint?: string | null
}

export function OverallSignal({
  teamId,
  teamName,
  needsAttention = false,
  vibeScore,
  wowScore,
  vibeParticipation,
  wowSessions,
  wowLevel,
  activeTab,
  vibeMessage,
  vibeSuggestion,
  vibeWowHint,
}: OverallSignalProps) {
  const t = useTranslation()

  // Get wow level info
  const levelInfo = wowLevel ? WOW_LEVELS.find(l => l.id === wowLevel) : null
  const levelColors = {
    shu: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700' },
    ha: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-300 dark:border-cyan-700' },
    ri: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-700' },
  }

  // Calculate combined score (weighted average)
  // Vibe: 60% weight (daily signal), Way of Work: 40% weight (periodic deep dive)
  let combinedScore: number | null = null
  let scoreSource: 'both' | 'vibe' | 'wow' | 'none' = 'none'

  if (vibeScore !== null && wowScore !== null) {
    combinedScore = vibeScore * 0.6 + wowScore * 0.4
    scoreSource = 'both'
  } else if (vibeScore !== null) {
    combinedScore = vibeScore
    scoreSource = 'vibe'
  } else if (wowScore !== null) {
    combinedScore = wowScore
    scoreSource = 'wow'
  }

  // Tab-aware score: show the relevant score for the active tab
  const displayScore = activeTab === 'vibe' ? (vibeScore ?? combinedScore) :
    activeTab === 'wow' ? (wowScore ?? combinedScore) :
    combinedScore
  const displayLabel = activeTab === 'vibe' ? 'Vibe' :
    activeTab === 'wow' ? 'Way of Work' :
    activeTab === 'feedback' ? t('feedbackTitle') :
    null

  // Determine health status
  const getHealthStatus = (score: number | null) => {
    if (score === null) return { label: t('signalNoData'), color: 'stone', icon: '○' }
    if (score >= 4) return { label: t('signalExcellent'), color: 'green', icon: '●' }
    if (score >= 3) return { label: t('signalGood'), color: 'cyan', icon: '●' }
    if (score >= 2) return { label: t('signalAttention'), color: 'amber', icon: '◐' }
    return { label: t('signalCritical'), color: 'red', icon: '○' }
  }

  const status = getHealthStatus(displayScore)

  // Color mappings for Tailwind
  const colorMap = {
    green: {
      bg: 'bg-green-500',
      bgLight: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      ring: 'ring-green-500/20',
    },
    cyan: {
      bg: 'bg-cyan-500',
      bgLight: 'bg-cyan-50 dark:bg-cyan-900/20',
      border: 'border-cyan-200 dark:border-cyan-800',
      text: 'text-cyan-700 dark:text-cyan-400',
      ring: 'ring-cyan-500/20',
    },
    amber: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      ring: 'ring-amber-500/20',
    },
    red: {
      bg: 'bg-red-500',
      bgLight: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      ring: 'ring-red-500/20',
    },
    stone: {
      bg: 'bg-stone-400 dark:bg-stone-600',
      bgLight: 'bg-stone-50 dark:bg-stone-800',
      border: 'border-stone-200 dark:border-stone-700',
      text: 'text-stone-500 dark:text-stone-400',
      ring: 'ring-stone-500/20',
    },
  }

  const colors = colorMap[status.color as keyof typeof colorMap]

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bgLight} p-4 sm:p-6`}>
      {/* Team name header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
          {teamName}
        </h1>
        <div className="flex items-center gap-1 ml-auto">
          <Link
            href={`/teams/${teamId}?tab=coach`}
            className="p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            title={t('coachQuestionsTab')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </Link>
          <Link
            href={`/teams/${teamId}?tab=settings`}
            className="p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            title={t('teamSettings')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
        {needsAttention && (
          <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
            {t('teamsNeedsAttention')}
          </span>
        )}
        {/* Show Shu-Ha-Ri level with subtitle instead of generic status */}
        {/* Needs attention reason */}
        {needsAttention && (vibeScore !== null || wowScore !== null) && (
          <div className="w-full mt-1 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-400">
              {vibeScore !== null && vibeScore < 2.5 && wowScore !== null && wowScore < 2.5
                ? `${t('attentionReasonVibe')} (${vibeScore.toFixed(1)}) · ${t('attentionReasonWow')} (${wowScore.toFixed(1)})`
                : vibeScore !== null && vibeScore < 2.5
                ? `${t('attentionReasonVibe')} (${vibeScore.toFixed(1)})`
                : wowScore !== null && wowScore < 2.5
                ? `${t('attentionReasonWow')} (${wowScore.toFixed(1)})`
                : null}
            </p>
          </div>
        )}
        {levelInfo && wowLevel ? (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${levelColors[wowLevel].bg} ${levelColors[wowLevel].text} ${levelColors[wowLevel].border} border`}>
            <span className="text-base font-bold">{levelInfo.kanji}</span>
            <span>{levelInfo.subtitle}</span>
          </span>
        ) : (
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colors.bgLight} ${colors.text} ${colors.border} border`}>
            {status.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Score circle */}
        <div className="relative">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${colors.bg} flex items-center justify-center ring-4 ${colors.ring}`}>
            {displayScore !== null ? (
              <span className="text-xl sm:text-2xl font-bold text-white">
                {displayScore.toFixed(1)}
              </span>
            ) : (
              <span className="text-xl sm:text-2xl text-white/60">—</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="mb-1">
            <h3 className="font-medium text-stone-700 dark:text-stone-300">
              {displayLabel ? `${displayLabel} ${t('signalTitle')}` : t('signalTitle')}
            </h3>
            {!activeTab && scoreSource === 'both' && (
              <p className="text-[10px] text-stone-400 dark:text-stone-500">{t('signalWeighting')}</p>
            )}
          </div>

          {/* Source indicators */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {/* On specific tabs, show only that score. On home/other, show both */}
            {activeTab === 'vibe' && vibeScore !== null && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500" />
                </svg>
                <span className="text-stone-600 dark:text-stone-400">
                  Vibe: {vibeScore.toFixed(1)}
                </span>
              </div>
            )}
            {activeTab === 'wow' && wowScore !== null && (
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-500 font-bold">Δ</span>
                <span className="text-stone-600 dark:text-stone-400">
                  Way of Work: {wowScore.toFixed(1)}
                </span>
              </div>
            )}
            {activeTab === 'feedback' && (
              <div className="flex flex-wrap items-center gap-3">
                {vibeScore !== null && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500" />
                    </svg>
                    <span className="text-stone-600 dark:text-stone-400">
                      Vibe: {vibeScore.toFixed(1)}
                    </span>
                  </div>
                )}
                {wowScore !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-500 font-bold">Δ</span>
                    <span className="text-stone-600 dark:text-stone-400">
                      WoW: {wowScore.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            )}
            {(!activeTab || (activeTab !== 'vibe' && activeTab !== 'wow' && activeTab !== 'feedback')) && (
              <>
                {vibeScore !== null && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500" />
                    </svg>
                    <span className="text-stone-600 dark:text-stone-400">
                      Vibe: {vibeScore.toFixed(1)}
                    </span>
                  </div>
                )}
                {wowScore !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-500 font-bold">Δ</span>
                    <span className="text-stone-600 dark:text-stone-400">
                      Way of Work: {wowScore.toFixed(1)}
                    </span>
                  </div>
                )}
              </>
            )}
            {scoreSource === 'none' && (
              <span className="text-stone-500 dark:text-stone-400">
                {t('signalCollectData')}
              </span>
            )}
          </div>

          {/* Data completeness hint */}
          {!activeTab && scoreSource !== 'both' && scoreSource !== 'none' && (
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              {scoreSource === 'vibe' ? t('signalAddWow') : t('signalAddVibe')}
            </p>
          )}
        </div>

        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {vibeParticipation}%
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">{t('signalParticipation')}</div>
          </div>
          <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
          <div>
            <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {wowSessions}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">{t('sessions')}</div>
          </div>
          {/* Shu-Ha-Ri Level */}
          {levelInfo && wowLevel && (
            <>
              <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
              <div className={`px-3 py-1.5 rounded-lg border ${levelColors[wowLevel].bg} ${levelColors[wowLevel].border}`}>
                <div className={`text-xl font-bold ${levelColors[wowLevel].text}`}>
                  {levelInfo.kanji}
                </div>
                <div className={`text-xs font-medium ${levelColors[wowLevel].text}`}>
                  {levelInfo.label}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Vibe context message (only shown when on Vibe tab) */}
      {vibeMessage && (
        <div className="mt-4 pt-4 border-t border-stone-200/50 dark:border-stone-700/50">
          <p className={`font-medium ${colors.text}`}>{vibeMessage}</p>
          {vibeSuggestion && (
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{vibeSuggestion}</p>
          )}
          {/* Soft guidance to Way of Work when vibe needs attention */}
          {vibeWowHint && (
            <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2 flex items-center gap-1.5">
              <span className="font-bold">Δ</span>
              {vibeWowHint}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
