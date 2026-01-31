'use client'

import { MoodStats } from '@/domain/moods/actions'
import { useLanguage } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { Fly, signalToFlyFrequency } from '@/components/ui/fly'

interface CheckinSuccessProps {
  mood: number
  streak: number
  teamStats?: MoodStats
  teamName: string
}

// Purity levels like Heisenberg's product
const PURITY_LABELS = ['50%', '70%', '85%', '96%', '99.1%']

// Dynamic messages based on mood level - Breaking Bad style
const MOOD_MESSAGES = {
  nl: {
    1: ['Zware dag in het lab.', 'Soms gaat het zo.', 'Morgen een nieuwe batch.'],
    2: ['Nog niet de juiste formule.', 'We komen er wel.', 'Elke dag telt.'],
    3: ['Stabiel product.', 'Solide basis.', 'Steady state.'],
    4: ['Goede batch!', 'De formule werkt.', 'Mooie resultaten.'],
    5: ['Heisenberg-niveau!', 'Perfecte batch.', '99.1% pure excellence.'],
  },
  en: {
    1: ['Rough day in the lab.', 'Sometimes it goes like this.', 'New batch tomorrow.'],
    2: ['Not the right formula yet.', "We'll get there.", 'Every day counts.'],
    3: ['Stable product.', 'Solid foundation.', 'Steady state.'],
    4: ['Good batch!', 'The formula works.', 'Nice results.'],
    5: ['Heisenberg level!', 'Perfect batch.', '99.1% pure excellence.'],
  },
}

// Streak messages
const STREAK_MESSAGES = {
  nl: {
    first: 'Eerste sample in het lab!',
    early: 'Je bouwt momentum op.',
    good: 'Consistent contributen!',
    great: 'Lab veteraan!',
    legendary: 'Echte Heisenberg vibes.',
  },
  en: {
    first: 'First sample in the lab!',
    early: 'Building momentum.',
    good: 'Consistent contributor!',
    great: 'Lab veteran!',
    legendary: 'True Heisenberg vibes.',
  },
}

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

function getStreakMessage(streak: number, lang: 'nl' | 'en'): string {
  const messages = STREAK_MESSAGES[lang]
  if (streak === 1) return messages.first
  if (streak < 5) return messages.early
  if (streak < 10) return messages.good
  if (streak < 20) return messages.great
  return messages.legendary
}

export function CheckinSuccess({ mood, streak, teamStats, teamName }: CheckinSuccessProps) {
  const { t, language } = useLanguage()
  const purity = PURITY_LABELS[mood - 1] || '99.1%'

  const moodMessage = getRandomMessage(MOOD_MESSAGES[language][mood as keyof typeof MOOD_MESSAGES.nl] || MOOD_MESSAGES[language][3])
  const streakMessage = getStreakMessage(streak, language)

  const isGoodStreak = streak >= 3
  const isGreatStreak = streak >= 7
  const isLegendaryStreak = streak >= 14
  const isEpicStreak = streak >= 30
  const isMilestone = streak === 7 || streak === 14 || streak === 30

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-900 relative overflow-hidden">
      {/* Easter egg: The Fly - Breaking Bad S03E10 */}
      {/* Fly calms down after successful check-in (reflects the submitted mood) */}
      <Fly frequency={signalToFlyFrequency(mood)} />

      {/* Easter egg: RV driving away */}
      <div className="absolute bottom-10 -right-10 text-4xl opacity-30">
        🚐💨
      </div>

      {/* Header */}
      <header className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚗️</span>
            <span className="text-sm text-stone-400 dark:text-stone-500">{t('pulse')}</span>
          </div>
          <LanguageToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8 relative z-10">
        <div className="text-center max-w-md">
          {/* Success - lab beaker with color based on mood */}
          <div className="text-6xl mb-6">
            {mood === 5 ? '🏆' : mood >= 4 ? '✨' : '🧪'}
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            {t('successTitle')}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mb-2">
            {t('successRecorded')}
          </p>

          {/* Dynamic mood message */}
          <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium mb-8">
            {moodMessage}
          </p>

          {/* Signal value */}
          <div className={`mb-8 p-6 rounded-2xl border ${mood >= 4 ? 'bg-gradient-to-br from-cyan-50 dark:from-cyan-900/30 to-white dark:to-stone-800 border-cyan-200 dark:border-cyan-800' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'}`}>
            <div className="text-5xl font-bold text-stone-900 dark:text-stone-100 mb-1">
              {mood}
            </div>
            <p className={`text-sm font-mono ${mood === 5 ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-cyan-500 dark:text-cyan-400'}`}>
              {purity} pure
            </p>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className={`relative mb-8 p-4 rounded-2xl transition-all duration-500 ${
              isEpicStreak
                ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white shadow-xl scale-105'
                : isLegendaryStreak
                  ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 text-white shadow-lg'
                  : isGreatStreak
                    ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md'
                    : isGoodStreak
                      ? 'bg-gradient-to-br from-stone-600 to-stone-700 text-white'
                      : 'bg-stone-100 dark:bg-stone-800'
            } ${isMilestone ? 'ring-4 ring-white/50' : ''}`}>
              {/* Milestone badge */}
              {isMilestone && (
                <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  🎉 MILESTONE!
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">
                  {isEpicStreak ? '🧙‍♂️' : isLegendaryStreak ? '👨‍🔬' : isGreatStreak ? '🔥' : isGoodStreak ? '⚗️' : streak > 1 ? '✨' : '🌱'}
                </span>
                <span className={`text-3xl font-bold ${isGoodStreak ? 'text-white' : 'text-stone-900 dark:text-stone-100'}`}>
                  {streak}
                </span>
                <span className={`text-sm ${isGoodStreak ? 'text-white/90' : 'text-stone-500 dark:text-stone-400'}`}>
                  {streak === 1 ? t('successStreakSingular') : t('successStreak')}
                </span>
              </div>
              <p className={`text-xs ${isGoodStreak ? 'text-white/80' : 'text-stone-400 dark:text-stone-500'}`}>
                {streakMessage}
              </p>
            </div>
          )}

          {/* Team stats */}
          {teamStats && teamStats.total_entries > 0 && (
            <div className="bg-white dark:bg-stone-800 rounded-2xl p-5 border border-stone-200 dark:border-stone-700 mb-6">
              <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-4">{t('successTeamToday')}</p>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    {teamStats.average_mood.toFixed(1)}
                  </div>
                  <div className="text-xs text-stone-400 dark:text-stone-500">
                    {t('successAverage')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    {teamStats.total_entries}
                  </div>
                  <div className="text-xs text-stone-400 dark:text-stone-500">
                    {t('successCheckins')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coaching tip - contextual based on mood */}
          <div className={`rounded-xl p-4 mb-6 text-left ${mood <= 2 ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800' : 'bg-stone-100 dark:bg-stone-800'}`}>
            <div className="flex items-start gap-3">
              <span className="text-lg">{mood <= 2 ? '💬' : '💡'}</span>
              <div>
                <p className={`text-xs font-medium mb-1 ${mood <= 2 ? 'text-amber-700 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'}`}>
                  {t('coachingTipTitle')}
                </p>
                <p className={`text-sm ${mood <= 2 ? 'text-amber-800 dark:text-amber-300' : 'text-stone-600 dark:text-stone-300'}`}>
                  {mood <= 2 ? t('coachingTipLow') : t('coachingTipRetro')}
                </p>
              </div>
            </div>
          </div>

          {/* Return message */}
          <p className="text-stone-400 dark:text-stone-500 text-sm">
            {t('successSeeYouTomorrow')}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-stone-400 dark:text-stone-500 relative z-10">
        {teamName}
      </footer>
    </div>
  )
}
