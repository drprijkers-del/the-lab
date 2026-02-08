'use client'

import { useTranslation } from '@/lib/i18n/context'
import {
  type WowLevel,
  type LevelProgress,
  type LevelRisk,
  getLevelInfo,
  getUnlockRequirements,
  WOW_LEVELS,
} from '@/domain/wow/types'

interface WowLevelProps {
  level: WowLevel
  progress?: LevelProgress | null
  risk?: LevelRisk | null
  compact?: boolean
}

// Level colors configuration
const levelColors = {
  shu: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    bgSolid: 'bg-amber-500',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-400',
    kanji: 'text-amber-600 dark:text-amber-400',
    progress: 'bg-amber-500',
    glow: 'shadow-amber-200 dark:shadow-amber-900/50',
  },
  ha: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    bgSolid: 'bg-cyan-500',
    border: 'border-cyan-300 dark:border-cyan-700',
    text: 'text-cyan-700 dark:text-cyan-400',
    kanji: 'text-cyan-600 dark:text-cyan-400',
    progress: 'bg-cyan-500',
    glow: 'shadow-cyan-200 dark:shadow-cyan-900/50',
  },
  ri: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    bgSolid: 'bg-purple-500',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-400',
    kanji: 'text-purple-600 dark:text-purple-400',
    progress: 'bg-purple-500',
    glow: 'shadow-purple-200 dark:shadow-purple-900/50',
  },
}

export function WowLevelDisplay({
  level,
  progress,
  risk,
  compact = false,
}: WowLevelProps) {
  const t = useTranslation()
  const currentLevelIndex = WOW_LEVELS.findIndex(l => l.id === level)
  const isMaxLevel = level === 'ri'

  // Static requirements for each level (shown when no progress data)
  // Must match getUnlockRequirements() in domain/wow/types.ts
  const staticRequirements = {
    shu: [
      { key: 'sessions', label: t('reqSessions30d'), required: 3 },
      { key: 'diversity', label: t('reqAngles5'), required: 5 },
      { key: 'score', label: t('reqScore32'), required: 3.2 },
      { key: 'participation', label: t('reqParticipation60'), required: 60 },
    ],
    ha: [
      { key: 'total_sessions', label: t('reqSessionsTotal6'), required: 6 },
      { key: 'diversity', label: t('reqAngles7'), required: 7 },
      { key: 'followups', label: t('reqFollowups4'), required: 4 },
      { key: 'recency', label: t('reqSessions45d'), required: 3 },
      { key: 'score', label: t('reqScore35'), required: 3.5 },
      { key: 'participation', label: t('reqParticipation70'), required: 70 },
    ],
    ri: [], // Max level
  }

  // Get unlock requirements for next level
  const requirements = progress ? getUnlockRequirements(level, progress) : []
  const hasProgressData = requirements.length > 0
  const displayRequirements = hasProgressData ? requirements : staticRequirements[level].map(r => ({ ...r, met: false, current: 0 }))
  const metRequirements = requirements.filter(r => r.met).length
  const totalRequirements = hasProgressData ? requirements.length : staticRequirements[level].length
  const progressPercent = totalRequirements > 0 && hasProgressData
    ? Math.round((metRequirements / totalRequirements) * 100)
    : 0

  const colors = levelColors[level]

  // Compact version - just a badge
  if (compact) {
    const levelInfo = getLevelInfo(level)
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${colors.bg} ${colors.border} border`}>
        <span className={`text-lg font-bold ${colors.kanji}`}>{levelInfo.kanji}</span>
        <span className={`text-sm font-medium ${colors.text}`}>{levelInfo.label}</span>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* Level Roadmap - All 3 levels visible */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">
            {t('wowMastery')}
          </h3>
          {risk && risk.state !== 'none' && (
            <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
              <span>⚠</span>
              <span>{risk.reason || t('levelRiskGeneric')}</span>
            </div>
          )}
        </div>

        {/* Three Level Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {WOW_LEVELS.map((levelInfo, index) => {
            const isUnlocked = index <= currentLevelIndex
            const isCurrent = levelInfo.id === level
            const isNext = index === currentLevelIndex + 1
            const lColors = levelColors[levelInfo.id]

            return (
              <div
                key={levelInfo.id}
                className={`relative rounded-xl p-3 sm:p-4 transition-all ${
                  isCurrent
                    ? `${lColors.bg} ${lColors.border} border-2 shadow-lg ${lColors.glow}`
                    : isUnlocked
                    ? `${lColors.bg} ${lColors.border} border opacity-60`
                    : 'bg-stone-100 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600 opacity-50'
                }`}
              >
                {/* Lock icon for locked levels */}
                {!isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-4 h-4 text-stone-400 dark:text-stone-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Current level indicator */}
                {isCurrent && (
                  <div className="absolute -top-1 -right-1">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${lColors.bgSolid} text-white text-xs font-bold shadow-md`}>
                      ✓
                    </span>
                  </div>
                )}

                {/* Kanji character */}
                <div className={`text-2xl sm:text-3xl font-bold mb-1 ${
                  isUnlocked ? lColors.kanji : 'text-stone-400 dark:text-stone-500'
                }`}>
                  {levelInfo.kanji}
                </div>

                {/* Level name */}
                <div className={`font-semibold text-sm sm:text-base ${
                  isUnlocked ? lColors.text : 'text-stone-400 dark:text-stone-500'
                }`}>
                  {levelInfo.label}
                </div>

                {/* Subtitle */}
                <div className={`text-xs mt-0.5 ${
                  isUnlocked ? 'text-stone-600 dark:text-stone-400' : 'text-stone-400 dark:text-stone-500'
                }`}>
                  {levelInfo.subtitle}
                </div>

                {/* "Next" badge for next level */}
                {isNext && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-200 dark:bg-stone-600 text-stone-600 dark:text-stone-300">
                      {t('nextLevel')}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Progress connector line */}
        <div className="relative mt-4 mb-2">
          <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.progress} transition-all duration-700`}
              style={{ width: `${((currentLevelIndex + (progressPercent / 100)) / 3) * 100}%` }}
            />
          </div>
          {/* Level markers on the progress bar */}
          <div className="absolute top-0 left-0 right-0 h-2 flex justify-between px-[16.67%]">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={`w-0.5 h-full ${
                  i < currentLevelIndex ? 'bg-white/50' : 'bg-stone-300 dark:bg-stone-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Requirements Section */}
      {!isMaxLevel && (
        <div className="border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${levelColors[WOW_LEVELS[currentLevelIndex + 1]?.id || 'ha'].kanji}`}>
                {WOW_LEVELS[currentLevelIndex + 1]?.kanji}
              </span>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {level === 'shu' ? t('unlockHaTitle') : t('unlockRiTitle')}
              </span>
            </div>
            <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
              {metRequirements}/{totalRequirements}
            </span>
          </div>

          {/* Requirements checklist */}
          <div className="space-y-2">
            {displayRequirements.map((req) => (
              <div
                key={req.key}
                className={`flex items-center justify-between p-2.5 rounded-lg ${
                  req.met
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-white dark:bg-stone-700/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {req.met ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-stone-300 dark:border-stone-500" />
                  )}
                  <span className={`text-sm ${
                    req.met
                      ? 'text-green-700 dark:text-green-400 font-medium'
                      : 'text-stone-700 dark:text-stone-300'
                  }`}>
                    {req.label}
                  </span>
                </div>
                {!req.met && req.current !== undefined && (
                  <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
                    {req.current} / {req.required}
                  </span>
                )}
                {req.met && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">✓</span>
                )}
              </div>
            ))}
          </div>

          {/* Encouragement message */}
          <div className="mt-4 text-center">
            {progressPercent === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('levelStartHint')}
              </p>
            ) : progressPercent < 100 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('levelProgressHint')} {progressPercent}%
              </p>
            ) : (
              <p className={`text-sm font-medium ${levelColors[WOW_LEVELS[currentLevelIndex + 1]?.id || 'ha'].text}`}>
                {t('levelAllMet')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Max level celebration */}
      {isMaxLevel && (
        <div className="border-t border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 sm:p-5">
          <div className="flex items-center gap-3 text-purple-700 dark:text-purple-300">
            <span className="text-2xl">✦</span>
            <div>
              <div className="font-semibold">{t('levelMasteryAchieved')}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                {t('levelMaxReached')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Question depth badge for wow list
export function QuestionDepthBadge({ level }: { level: WowLevel }) {
  const levelInfo = getLevelInfo(level)

  const badgeColors = {
    shu: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    ha: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
    ri: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${badgeColors[level]}`}>
      <span className="font-bold">{levelInfo.kanji}</span>
      {levelInfo.questionDepth}
    </span>
  )
}

// Small level indicator for session cards
export function SessionLevelHint({
  currentLevel,
  sessionScore,
  requiredScore,
}: {
  currentLevel: WowLevel
  sessionScore?: number | null
  requiredScore: number
}) {
  if (!sessionScore) return null

  const isAboveTarget = sessionScore >= requiredScore
  const nextLevel = currentLevel === 'shu' ? 'ha' : currentLevel === 'ha' ? 'ri' : null

  if (!nextLevel) return null

  return (
    <div className={`text-xs ${isAboveTarget ? 'text-green-600 dark:text-green-400' : 'text-stone-400 dark:text-stone-500'}`}>
      {isAboveTarget ? (
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Meets {WOW_LEVELS.find(l => l.id === nextLevel)?.label} target
        </span>
      ) : (
        <span>Need ≥{requiredScore} for {WOW_LEVELS.find(l => l.id === nextLevel)?.label}</span>
      )}
    </div>
  )
}
