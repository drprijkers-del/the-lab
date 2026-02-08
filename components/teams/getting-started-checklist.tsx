'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'

interface GettingStartedChecklistProps {
  teamId: string
  teamSlug: string
  activeTab: 'home' | 'vibe' | 'wow' | 'feedback' | 'coach' | 'modules' | 'settings'
  hasPulseEntries: boolean
  hasWowSessions: boolean
  hasClosedSessions: boolean
}

export function GettingStartedChecklist({
  teamId,
  teamSlug,
  activeTab,
  hasPulseEntries,
  hasWowSessions,
  hasClosedSessions,
}: GettingStartedChecklistProps) {
  const t = useTranslation()
  const [dismissed, setDismissed] = useState(true) // Start hidden to prevent flash

  // Check localStorage on mount - separate dismiss state per tab
  useEffect(() => {
    const key = `team-${teamId}-${activeTab}-onboarding-dismissed`
    const isDismissed = localStorage.getItem(key) === 'true'
    setDismissed(isDismissed)
  }, [teamId, activeTab])

  const handleDismiss = () => {
    const key = `team-${teamId}-${activeTab}-onboarding-dismissed`
    localStorage.setItem(key, 'true')
    setDismissed(true)
  }

  // Only show for vibe and wow tabs
  if (activeTab !== 'vibe' && activeTab !== 'wow') return null

  // Vibe tab: show vibe onboarding
  if (activeTab === 'vibe') {
    // Don't show if already has entries or dismissed
    if (dismissed || hasPulseEntries) return null

    return (
      <div className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2 12h3l2-6 3 12 3-8 2 4h7"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-cyan-600 dark:text-cyan-400"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                {t('vibeOnboardingTitle')}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('vibeOnboardingSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2.5 -m-1 hover:bg-cyan-100 dark:hover:bg-cyan-800/50 rounded-lg transition-colors text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 min-w-11 min-h-11 flex items-center justify-center"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-600 text-stone-500 dark:text-stone-400 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold">1</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {t('onboardingStep1')}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {t('onboardingStep1Hint')}
              </p>
            </div>
            <span className="px-4 py-2.5 text-xs font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg shrink-0 min-h-11 flex items-center">
              {t('onboardingUseShareLink')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Way of Work tab: show wow onboarding
  if (activeTab === 'wow') {
    const allWowComplete = hasWowSessions && hasClosedSessions
    if (dismissed || allWowComplete) return null

    const steps = [
      { id: 'session', done: hasWowSessions },
      { id: 'insights', done: hasClosedSessions },
    ]
    const completedCount = steps.filter(s => s.done).length

    return (
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-xl font-bold text-cyan-600">
              Δ
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                {t('wowOnboardingTitle')}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('wowOnboardingSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2.5 -m-1 hover:bg-cyan-100 dark:hover:bg-cyan-800/50 rounded-lg transition-colors text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 min-w-11 min-h-11 flex items-center justify-center"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>{completedCount} / {steps.length} {t('onboardingComplete')}</span>
          </div>
          <div className="h-2 bg-white dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {/* Step 1: Start a session */}
          <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
            hasWowSessions
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              hasWowSessions
                ? 'bg-green-500 text-white'
                : 'bg-stone-200 dark:bg-stone-600 text-stone-500 dark:text-stone-400'
            }`}>
              {hasWowSessions ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-xs font-bold">1</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${hasWowSessions ? 'text-green-700 dark:text-green-400' : 'text-stone-700 dark:text-stone-300'}`}>
                {t('onboardingStep2')}
              </p>
              {!hasWowSessions && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {t('onboardingStep2Hint')}
                </p>
              )}
            </div>
            {!hasWowSessions && (
              <Link
                href={`/teams/${teamId}/wow/new`}
                className="px-4 py-2.5 text-xs font-medium bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors shrink-0 min-h-11 flex items-center"
              >
                {t('onboardingStartSession')}
              </Link>
            )}
          </div>

          {/* Step 2: Review insights */}
          <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
            hasClosedSessions
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              hasClosedSessions
                ? 'bg-green-500 text-white'
                : 'bg-stone-200 dark:bg-stone-600 text-stone-500 dark:text-stone-400'
            }`}>
              {hasClosedSessions ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-xs font-bold">2</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${hasClosedSessions ? 'text-green-700 dark:text-green-400' : 'text-stone-700 dark:text-stone-300'}`}>
                {t('onboardingStep3')}
              </p>
              {!hasClosedSessions && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {t('onboardingStep3Hint')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
