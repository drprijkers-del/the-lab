'use client'

import { useEffect, useState } from 'react'
import { getTeamMoodStats, getParticipantStreak, MoodStats } from '@/domain/moods/actions'
import { useLanguage } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/ui/language-toggle'

interface AlreadyCheckedInProps {
  teamName: string
}

// Purity levels like Heisenberg's product
const PURITY_LABELS = ['50%', '70%', '85%', '96%', '99.1%']

// Streak messages
const STREAK_MESSAGES = {
  nl: {
    early: 'Je bouwt momentum op.',
    good: 'Consistent contributen!',
    great: 'Lab veteraan!',
    legendary: 'Echte Heisenberg vibes.',
  },
  en: {
    early: 'Building momentum.',
    good: 'Consistent contributor!',
    great: 'Lab veteran!',
    legendary: 'True Heisenberg vibes.',
  },
}

function getStreakMessage(streak: number, lang: 'nl' | 'en'): string {
  const messages = STREAK_MESSAGES[lang]
  if (streak < 5) return messages.early
  if (streak < 10) return messages.good
  if (streak < 20) return messages.great
  return messages.legendary
}

export function AlreadyCheckedIn({ teamName }: AlreadyCheckedInProps) {
  const { t, language } = useLanguage()
  const [stats, setStats] = useState<MoodStats | null>(null)
  const [streak, setStreak] = useState<number>(0)

  useEffect(() => {
    async function loadData() {
      const [moodStats, participantStreak] = await Promise.all([
        getTeamMoodStats(),
        getParticipantStreak(),
      ])
      setStats(moodStats)
      setStreak(participantStreak)
    }
    loadData()
  }, [])

  const avgPurity = stats?.average_mood
    ? PURITY_LABELS[Math.round(stats.average_mood) - 1] || '85%'
    : '85%'

  const isGoodStreak = streak >= 3
  const isGreatStreak = streak >= 7
  const isLegendaryStreak = streak >= 14

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 relative overflow-hidden">
      {/* Easter egg: RV */}
      <div className="absolute bottom-20 right-10 text-2xl opacity-10">
        🚐
      </div>

      {/* Header */}
      <header className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐔</span>
            <span className="text-sm text-stone-400">{t('pinkPollos')}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <span className="inline-flex items-center gap-1 text-xs text-stone-500 border border-stone-200 px-2 py-1 rounded-full">
              ⚗️ {t('pulse')}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="text-center max-w-md">
          {/* Already checked in */}
          <div className="text-6xl mb-6">🧪</div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">
            {t('alreadyTitle')}
          </h1>
          <p className="text-stone-500 mb-8">
            {t('alreadyMessage')}
          </p>

          {/* Streak - prominent */}
          {streak > 0 && (
            <div className={`
              mb-8 p-4 rounded-2xl
              ${isLegendaryStreak
                ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 text-white shadow-lg'
                : isGreatStreak
                  ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md'
                  : isGoodStreak
                    ? 'bg-gradient-to-br from-stone-600 to-stone-700 text-white shadow-md'
                    : 'bg-stone-100'
              }
            `}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className={`text-2xl ${streak > 2 ? 'animate-pulse' : ''}`}>
                  {isLegendaryStreak ? '👨‍🔬' : isGreatStreak ? '🔥' : streak > 1 ? '⚗️' : '✨'}
                </span>
                <span className={`text-3xl font-bold ${isGoodStreak ? 'text-white' : 'text-stone-900'}`}>
                  {streak}
                </span>
                <span className={`text-sm ${isGoodStreak ? 'text-white/90' : 'text-stone-500'}`}>
                  {streak === 1 ? t('successStreakSingular') : t('successStreak')}
                </span>
              </div>
              {streak > 1 && (
                <p className={`text-xs ${isGoodStreak ? 'text-white/80' : 'text-stone-400'}`}>
                  {getStreakMessage(streak, language)}
                </p>
              )}
            </div>
          )}

          {/* Team stats */}
          {stats && stats.total_entries > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200">
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-4">{t('successTeamToday')}</p>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-stone-900">
                    {stats.average_mood.toFixed(1)}
                  </div>
                  <div className="text-xs text-cyan-500 font-mono">
                    {avgPurity} pure
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-stone-900">
                    {stats.total_entries}
                  </div>
                  <div className="text-xs text-stone-400">
                    {t('alreadyCheckedToday')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-stone-400">
        {teamName}
      </footer>
    </div>
  )
}
