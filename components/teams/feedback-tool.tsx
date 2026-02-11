'use client'

import { useState, useEffect } from 'react'
import { useTranslation, useLanguage } from '@/lib/i18n/context'
import { getFeedbackShareLink, deactivateFeedbackLink, getTeamFeedbackGrouped, clearTeamFeedback, type TeamFeedback } from '@/domain/feedback/actions'

interface FeedbackToolProps {
  teamId: string
  teamName: string
}

// Updated prompt labels to match new coaching-oriented prompts
const PROMPT_LABELS: Record<string, { nl: string; en: string; icon: string; color: string }> = {
  helps_collaboration: { nl: 'Wat helpt onze samenwerking', en: 'What helps our collaboration', icon: '✓', color: 'green' },
  gets_in_way: { nl: 'Wat staat soms in de weg', en: 'What sometimes gets in the way', icon: '↗', color: 'amber' },
  awareness: { nl: 'Iets om bewust van te zijn', en: 'Something to be aware of', icon: '○', color: 'purple' },
  // Legacy support for old prompts
  working_well: { nl: 'Wat gaat goed', en: 'What is working well', icon: '✓', color: 'green' },
  could_improve: { nl: 'Wat kan beter', en: 'What could improve', icon: '↗', color: 'amber' },
  other: { nl: 'Overig', en: 'Other', icon: '…', color: 'stone' },
}

export function FeedbackTool({ teamId, teamName }: FeedbackToolProps) {
  const t = useTranslation()
  const { language } = useLanguage()
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [feedback, setFeedback] = useState<Record<string, TeamFeedback[]>>({})
  const [feedbackLoading, setFeedbackLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const [showFeedbackFlow, setShowFeedbackFlow] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('feedback_flow_visible')
    return stored === null ? true : stored === 'true'
  })

  const toggleFeedbackFlow = () => {
    setShowFeedbackFlow(prev => {
      const next = !prev
      localStorage.setItem('feedback_flow_visible', String(next))
      return next
    })
  }

  const loadFeedback = async () => {
    setFeedbackLoading(true)
    try {
      const grouped = await getTeamFeedbackGrouped(teamId)
      setFeedback(grouped)
    } catch (error) {
      console.error('Failed to load feedback:', error)
    }
    setFeedbackLoading(false)
  }

  // Load share link and feedback on mount
  /* eslint-disable react-hooks/set-state-in-effect -- async data fetch, setState in callback */
  useEffect(() => {
    loadFeedback()
    handleGetShareLink() // Auto-fetch/create link on mount
  }, [teamId])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleGetShareLink = async () => {
    setShareLoading(true)
    try {
      const result = await getFeedbackShareLink(teamId)
      if (result) {
        setShareUrl(result.url)
      }
    } catch (error) {
      console.error('Failed to get share link:', error)
    }
    setShareLoading(false)
  }

  const handleDeactivateLink = async () => {
    if (!confirm(t('feedbackDeactivateConfirm'))) return
    setShareLoading(true)
    const result = await deactivateFeedbackLink(teamId)
    if (result.success) {
      setShareUrl(null)
      setShowAdvanced(false)
    } else {
      alert(result.error || 'Kon link niet deactiveren')
    }
    setShareLoading(false)
  }

  const handleArchiveFeedback = async () => {
    if (!confirm(t('feedbackArchiveConfirm'))) return
    const result = await clearTeamFeedback(teamId)
    if (result.success) {
      setFeedback({})
    } else {
      alert(result.error || 'Kon feedback niet archiveren')
    }
  }

  const totalFeedbackCount = Object.values(feedback).flat().length

  const facilitatorSteps = [
    t('feedbackFacilitator1'),
    t('feedbackFacilitator2'),
    t('feedbackFacilitator3'),
    t('feedbackFacilitator4'),
  ]

  return (
    <div className="space-y-6">
      {/* Title and intro - collapsible */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            {language === 'nl' ? 'De flow' : 'The flow'}
          </h2>
          <button
            onClick={toggleFeedbackFlow}
            className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
            title={showFeedbackFlow ? 'Hide flow' : 'Show flow'}
          >
            <svg
              className={`w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-transform ${
                showFeedbackFlow ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="accordion-content" data-open={showFeedbackFlow}>
          <div className="space-y-3">
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {language === 'nl'
                ? 'Luister naar wat je team wil delen. Context voor gesprekken, niet voor conclusies.'
                : 'Listen to what your team wants to share. Context for conversations, not for conclusions.'}
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {language === 'nl'
                ? 'Dit anonieme feedback-instrument helpt je team open te delen wat helpt en wat soms in de weg staat. Het geeft jou als facilitator context voor diepere gesprekken tijdens retrospectives of één-op-één sessies. Gebruik de inzichten niet als harde conclusies, maar als startpunt voor dialoog.'
                : 'This anonymous feedback tool helps your team openly share what helps and what sometimes gets in the way. It gives you as facilitator context for deeper conversations during retrospectives or one-on-one sessions. Don\'t use the insights as hard conclusions, but as a starting point for dialogue.'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {facilitatorSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 dark:bg-stone-700/30">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-stone-600 dark:text-stone-300 leading-snug">{step}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 dark:text-stone-500 italic leading-relaxed">
              {t('feedbackFraming')}
            </p>
          </div>
        </div>
      </div>

      {/* Links & Actions */}
      <div className="bg-stone-50 dark:bg-stone-700/30 rounded-xl overflow-hidden">
        <div className="divide-y divide-stone-100 dark:divide-stone-700">
          {/* Share link row - always show (loading or ready) */}
          {shareLoading ? (
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-lg bg-stone-200 dark:bg-stone-600 flex items-center justify-center shrink-0 animate-pulse">
                <svg className="w-5 h-5 text-stone-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-stone-900 dark:text-stone-100">{t('shareLoading')}</div>
                <div className="text-sm text-stone-500 dark:text-stone-400">{t('shareLoadingDetail')}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-stone-900 dark:text-stone-100">{t('feedbackLinkReady')}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">{language === 'nl' ? 'Team leden delen feedback anoniem — link versturen via Slack of email' : 'Team members share feedback anonymously — send link via Slack or email'}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-3">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-600 text-stone-400 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  <svg className="w-3 h-3 inline-block -mt-px mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Reset
                </button>
                <button
                  onClick={() => {
                    if (shareUrl) {
                      navigator.clipboard.writeText(shareUrl)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }
                  }}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-600 text-stone-400 dark:text-stone-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  {copied ? t('shareCopied') : t('shareCopy')}
                </button>
                <button
                  onClick={() => shareUrl && window.open(shareUrl, '_blank')}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-600 text-stone-400 dark:text-stone-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  {t('shareOpen')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Advanced panel */}
        {showAdvanced && shareUrl && (
          <div className="border-t border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
            {/* Advanced header */}
            <div className="p-4 border-b border-purple-200/50 dark:border-purple-800/50">
              <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">{t('shareAdvanced')}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{language === 'nl' ? 'Reset voor verse links, of deactiveer wanneer delen moet stoppen' : 'Reset to generate fresh links, or deactivate when sharing needs to stop'}</p>
            </div>

            <div className="divide-y divide-purple-200/50 dark:divide-purple-800/50">
            {/* Reset row */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('feedbackResetTitle')}</div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('feedbackResetInfo')}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!confirm(t('feedbackResetConfirm'))) return
                  setShareUrl(null)
                  await handleGetShareLink()
                }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors shrink-0 ml-3"
              >
                {t('feedbackResetButton')}
              </button>
            </div>

            {/* Pause/Deactivate row */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('feedbackPauseTitle')}</div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('feedbackPauseInfo')}</p>
                </div>
              </div>
              <button
                onClick={handleDeactivateLink}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shrink-0 ml-3"
              >
                {t('feedbackPauseButton')}
              </button>
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Collected Feedback Display */}
      <div className="bg-stone-50 dark:bg-stone-700/30 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-stone-100 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-stone-900 dark:text-stone-100">{t('feedbackCollected')}</div>
              {totalFeedbackCount > 0 && (
                <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{t('feedbackReadAs')}</div>
              )}
            </div>
          </div>
          {totalFeedbackCount > 0 && (
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="text-xs text-stone-400 tabular-nums">{totalFeedbackCount}</span>
              <button
                onClick={handleArchiveFeedback}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-600 text-stone-400 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                {t('feedbackArchive')}
              </button>
            </div>
          )}
        </div>

        {feedbackLoading ? (
          <div className="p-8 text-center text-stone-400">
            {t('loading')}
          </div>
        ) : totalFeedbackCount === 0 ? (
          <div className="p-8 text-center">
            <div className="text-stone-300 dark:text-stone-600 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400">{t('feedbackEmptyState')}</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{t('feedbackEmptyStateHint')}</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-stone-100 dark:divide-stone-700/50">
              {Object.entries(PROMPT_LABELS).map(([key, label]) => {
                const items = feedback[key] || []
                if (items.length === 0) return null

                const colorStyles = {
                  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
                  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
                  stone: 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-600',
                }

                return (
                  <div key={key} className="p-4">
                    {/* Category header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium border ${colorStyles[label.color as keyof typeof colorStyles]}`}>
                        {label.icon}
                      </span>
                      <h5 className="font-medium text-stone-800 dark:text-stone-200 text-sm">
                        {label[language]}
                      </h5>
                    </div>
                    {/* Feedback items */}
                    <div className="space-y-2 ml-9">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed"
                        >
                          <p className="whitespace-pre-wrap">{item.response}</p>
                          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                            {new Date(item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Warning note */}
            <div className="p-3 border-t border-stone-100 dark:border-stone-700">
              <p className="text-xs text-stone-400 dark:text-stone-500 text-center italic">
                {t('feedbackPerspectiveWarning')}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Distinction from Retro */}
      <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed text-center italic">
        {t('feedbackNotRetro')}
      </p>
    </div>
  )
}
