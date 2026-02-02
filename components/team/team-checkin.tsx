'use client'

import { useState } from 'react'
import { submitMoodCheckin, CheckinResult } from '@/domain/moods/actions'
import { formatDate } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { Fly, signalToFlyFrequency } from '@/components/ui/fly'
import { CheckinSuccess } from './checkin-success'

interface TeamCheckinProps {
  teamName: string
}

export function TeamCheckin({ teamName }: TeamCheckinProps) {
  const t = useTranslation()
  const [selectedSignal, setSelectedSignal] = useState<number | null>(null)
  const [nickname, setNickname] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Signal scale: 1-5 with semantic labels
  const SIGNAL_SCALE = [
    { value: 1, color: 'bg-cyan-300', labelKey: 'moodVeryBad' as const },
    { value: 2, color: 'bg-cyan-400', labelKey: 'moodBad' as const },
    { value: 3, color: 'bg-cyan-500', labelKey: 'moodOkay' as const },
    { value: 4, color: 'bg-cyan-600', labelKey: 'moodGood' as const },
    { value: 5, color: 'bg-cyan-700', labelKey: 'moodGreat' as const },
  ]

  async function handleSubmit() {
    if (!selectedSignal) return

    setLoading(true)
    setError(null)

    const checkinResult = await submitMoodCheckin(
      selectedSignal,
      comment || undefined,
      nickname || undefined
    )

    setLoading(false)

    if (!checkinResult.success) {
      if (checkinResult.alreadyCheckedIn) {
        setResult(checkinResult)
      } else {
        setError(checkinResult.error || t('error'))
      }
      return
    }

    setResult(checkinResult)
  }

  if (result?.success) {
    return (
      <CheckinSuccess
        mood={selectedSignal!}
        streak={result.streak || 1}
        teamStats={result.teamStats}
        teamName={teamName}
      />
    )
  }

  if (result?.alreadyCheckedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50 dark:bg-stone-900">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-6">✓</div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            {t('alreadyTitle')}
          </h1>
          <p className="text-stone-500 dark:text-stone-400">
            {t('alreadyMessage')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-900 relative overflow-hidden">
      {/* Easter egg: The Fly - Breaking Bad S03E10 */}
      {/* Fly behavior responds to selected signal: low signal = more erratic */}
      <Fly frequency={signalToFlyFrequency(selectedSignal)} />

      {/* Header */}
      <header className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="leading-none">
            <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">Pulse</span>
            <span className="block text-[10px] font-medium text-stone-400 dark:text-stone-500 tracking-widest uppercase">labs</span>
          </div>
          <LanguageToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8 relative z-10">
        <div className="w-full max-w-lg">
          {/* Team & Date */}
          <div className="text-center mb-8">
            <p className="text-sm text-stone-400 dark:text-stone-500 mb-1">{formatDate(new Date())}</p>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{teamName}</h1>
          </div>

          {/* Question */}
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight text-stone-900 dark:text-stone-100">
            {t('checkinQuestion')} {t('checkinToday')}?
          </h2>

          {/* Signal selector with labels */}
          <div
            className="flex justify-center gap-2 md:gap-3 mb-10"
            role="radiogroup"
            aria-label="Select your mood level from 1 to 5"
          >
            {SIGNAL_SCALE.map((signal) => (
              <div key={signal.value} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setSelectedSignal(signal.value)}
                  role="radio"
                  aria-checked={selectedSignal === signal.value}
                  aria-label={`Mood level ${signal.value}, ${t(signal.labelKey)}`}
                  className={`
                    relative w-14 h-14 md:w-16 md:h-16
                    rounded-xl
                    flex items-center justify-center
                    text-xl md:text-2xl font-bold
                    transition-all duration-200
                    ${selectedSignal === signal.value
                      ? `${signal.color} text-white shadow-lg shadow-cyan-500/30 scale-110 ring-4 ring-cyan-200 dark:ring-cyan-800`
                      : 'bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:border-cyan-400 dark:hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:scale-105 hover:shadow-md active:scale-95'
                    }
                  `}
                >
                  {signal.value}
                </button>
                <span className={`text-xs font-medium transition-colors ${
                  selectedSignal === signal.value
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-stone-400 dark:text-stone-500'
                }`}>
                  {t(signal.labelKey)}
                </span>
              </div>
            ))}
          </div>

          {/* Optional fields */}
          <div className="space-y-4 mb-8">
            <input
              type="text"
              placeholder={t('checkinName')}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              aria-label="Your nickname (optional)"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:focus:ring-cyan-500 focus:border-transparent transition-all"
            />

            <div>
              <textarea
                placeholder={t('checkinComment')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                aria-label="Add a comment (optional)"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
              />
              {/* Coaching tip for low scores */}
              {selectedSignal && selectedSignal <= 2 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span>💬</span>
                  {t('coachingTipContext')}
                </p>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedSignal || loading}
            aria-label={loading ? 'Submitting your check-in' : 'Submit your mood check-in'}
            aria-busy={loading}
            className={`
              w-full py-4 px-6 rounded-xl font-medium text-lg
              transition-all duration-200
              ${selectedSignal
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200'
                : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'
              }
              disabled:opacity-50
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('checkinLoading')}
              </span>
            ) : (
              t('checkinButton')
            )}
          </button>

          {/* Privacy notice */}
          <div className="mt-6 text-center space-y-1">
            <p className="text-xs text-stone-400 dark:text-stone-500 flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('checkinAnonymous')}
            </p>
            <p className="text-[10px] text-stone-400 dark:text-stone-500">
              {t('checkinPrivacy')}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
