'use client'

import { useState, useEffect } from 'react'
import { submitFeedback } from '@/domain/feedback/actions'
import { useTranslation } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'

interface FeedbackFormProps {
  teamSlug: string
  teamName: string
  tokenHash: string
}

interface PromptField {
  key: string
  labelKey: string
  hintKey: string
  value: string
}

const MAX_CHARS = 500

export function FeedbackForm({ teamSlug, teamName, tokenHash }: FeedbackFormProps) {
  const t = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rulesAccepted, setRulesAccepted] = useState(false)

  // Device-based deduplication: check if this device already submitted feedback for this link
  const storageKey = `feedback_submitted_${teamSlug}_${tokenHash.slice(0, 12)}`

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey)) {
        setAlreadySubmitted(true)
      }
    } catch {
      // localStorage unavailable — allow submission
    }
  }, [storageKey])

  const [prompts, setPrompts] = useState<PromptField[]>([
    { key: 'helps_collaboration', labelKey: 'feedbackPromptHelps', hintKey: 'feedbackPromptHelpsHint', value: '' },
    { key: 'gets_in_way', labelKey: 'feedbackPromptBlocks', hintKey: 'feedbackPromptBlocksHint', value: '' },
    { key: 'awareness', labelKey: 'feedbackPromptAwareness', hintKey: 'feedbackPromptAwarenessHint', value: '' },
  ])

  const updatePrompt = (key: string, value: string) => {
    // Enforce character limit
    if (value.length <= MAX_CHARS) {
      setPrompts(prev => prev.map(p => p.key === key ? { ...p, value } : p))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Check if at least one field has content
    const hasContent = prompts.some(p => p.value.trim().length > 0)
    if (!hasContent) {
      setError(t('feedbackMinRequired'))
      return
    }

    setSubmitting(true)

    const submissions = prompts
      .filter(p => p.value.trim().length > 0)
      .map(p => ({ prompt_key: p.key, response: p.value }))

    const result = await submitFeedback(teamSlug, tokenHash, submissions)

    setSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Er ging iets mis')
      return
    }

    // Mark this device as having submitted for this link
    try {
      localStorage.setItem(storageKey, new Date().toISOString())
    } catch {
      // localStorage unavailable — not critical
    }

    setSubmitted(true)
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            {t('feedbackThankYou')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mb-4">
            {t('feedbackThankYouMessage')}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 italic mb-6">
            {t('feedbackUsedForConversation')}
          </p>

          {/* Close button */}
          <button
            onClick={() => window.close()}
            className="px-6 py-2 text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            {t('closePage')}
          </button>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
            {t('closeThisPage')}
          </p>
        </div>
      </div>
    )
  }

  // Already submitted on this device
  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            {t('feedbackAlreadySubmitted')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            {t('feedbackAlreadySubmittedMessage')}
          </p>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            {t('closePage')}
          </button>
        </div>
      </div>
    )
  }

  // Rules gate - must accept before seeing form
  if (!rulesAccepted) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
        <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
              {t('feedbackRulesTitle')}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {teamName}
            </p>
          </div>

          {/* Feedback Guidelines - prominent, not skippable */}
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-medium shrink-0">1</span>
                <p className="text-sm text-stone-700 dark:text-stone-300">{t('feedbackGuideline1')}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-medium shrink-0">2</span>
                <p className="text-sm text-stone-700 dark:text-stone-300">{t('feedbackGuideline2')}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-medium shrink-0">3</span>
                <p className="text-sm text-stone-700 dark:text-stone-300">{t('feedbackGuideline3')}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-medium shrink-0">4</span>
                <p className="text-sm text-stone-700 dark:text-stone-300">{t('feedbackGuideline4')}</p>
              </div>
            </div>
          </div>

          {/* Important note */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-300 text-center">
              {t('feedbackGuidelineNote')}
            </p>
          </div>

          {/* Continue button */}
          <Button
            onClick={() => setRulesAccepted(true)}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {t('feedbackUnderstand')}
          </Button>

          {/* Footer */}
          <p className="text-xs text-center text-stone-400 dark:text-stone-500 mt-6">
            {t('feedbackAnonymousNote')}
          </p>
        </div>
      </div>
    )
  }

  // Main form (after accepting rules)
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-1">
            {t('feedbackPageTitle')}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {teamName}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {prompts.map((prompt) => (
            <div key={prompt.key} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
              <label className="block text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">
                {t(prompt.labelKey as keyof typeof t)}
              </label>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                {t(prompt.hintKey as keyof typeof t)}
              </p>
              <textarea
                value={prompt.value}
                onChange={(e) => updatePrompt(prompt.key, e.target.value)}
                placeholder="..."
                rows={3}
                maxLength={MAX_CHARS}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
              />
              {prompt.value.length > 0 && (
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 text-right">
                  {prompt.value.length}/{MAX_CHARS}
                </p>
              )}
            </div>
          ))}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={submitting}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {submitting ? t('feedbackSubmitting') : t('feedbackSubmit')}
          </Button>
        </form>

        {/* Footer note */}
        <p className="text-xs text-center text-stone-400 dark:text-stone-500 mt-6 italic">
          {t('feedbackFooterNote')}
        </p>
      </div>
    </div>
  )
}
