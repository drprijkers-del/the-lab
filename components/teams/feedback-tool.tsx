'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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

  return (
    <div className="space-y-6">
      {/* Coach Role Guidance */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4">
        <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2 text-sm">{t('feedbackFacilitatorRole')}</h4>
        <ul className="space-y-1.5 text-xs text-purple-700 dark:text-purple-400">
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            <span>{t('feedbackFacilitator1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            <span>{t('feedbackFacilitator2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            <span>{t('feedbackFacilitator3')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            <span>{t('feedbackFacilitator4')}</span>
          </li>
        </ul>
      </div>

      {/* Primary CTA: Create Feedback Link */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              {shareUrl ? (
                <>
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('feedbackLinkReady')}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 truncate">{shareUrl}</div>
                </>
              ) : shareLoading ? (
                <>
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('shareLoading')}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">{t('shareLoadingDetail')}</div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('feedbackLinkCreate')}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">{t('feedbackLinkInvite')}</div>
                </>
              )}
            </div>
            {/* Desktop: Show create button inline */}
            {!shareUrl && !shareLoading && (
              <div className="hidden sm:block">
                <Button
                  onClick={handleGetShareLink}
                  loading={shareLoading}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {t('feedbackCreateLink')}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile: Full-width create button */}
          {!shareUrl && !shareLoading && (
            <div className="sm:hidden mt-3">
              <Button
                onClick={handleGetShareLink}
                loading={shareLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {t('feedbackCreateLink')}
              </Button>
            </div>
          )}

          {/* Action buttons when link exists - responsive grid */}
          {shareUrl && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl)
                }}
                className="w-full"
              >
                {t('shareCopy')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(shareUrl, '_blank')}
                className="w-full"
              >
                {t('shareOpen')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`w-full ${showAdvanced ? 'bg-stone-100 dark:bg-stone-700' : ''}`}
              >
                {t('shareAdvanced')}
              </Button>
            </div>
          )}
        </div>

        {/* Link context */}
        {!shareUrl && !shareLoading && (
          <div className="px-4 pb-4">
            <p className="text-xs text-stone-400 dark:text-stone-500 italic">
              {t('feedbackLinkContext')}
            </p>
          </div>
        )}

        {/* Advanced panel */}
        {showAdvanced && (
          <div className="border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-4 space-y-4">
            {/* Reset Link */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('feedbackResetTitle')}</div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('feedbackResetInfo')}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    if (!confirm(t('feedbackResetConfirm'))) return
                    setShareUrl(null)
                    await handleGetShareLink()
                  }}
                  loading={shareLoading}
                  className="text-amber-600 hover:text-amber-700 mt-2"
                >
                  {t('feedbackResetButton')}
                </Button>
              </div>
            </div>

            {/* Deactivate Link */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-700 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t('feedbackPauseTitle')}</div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{t('feedbackPauseInfo')}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDeactivateLink}
                  loading={shareLoading}
                  className="text-stone-500 hover:text-stone-700 mt-2"
                >
                  {t('feedbackPauseButton')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collected Feedback Display */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <div>
            <h4 className="font-medium text-stone-900 dark:text-stone-100">{t('feedbackCollected')}</h4>
            {totalFeedbackCount > 0 && (
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                {t('feedbackReadAs')}
              </p>
            )}
          </div>
          {totalFeedbackCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">{totalFeedbackCount}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleArchiveFeedback}
                className="text-stone-400 hover:text-stone-600 text-xs"
              >
                {t('feedbackArchive')}
              </Button>
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
                    {/* Category header - prominent */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium border ${colorStyles[label.color as keyof typeof colorStyles]}`}>
                        {label.icon}
                      </span>
                      <h5 className="font-medium text-stone-800 dark:text-stone-200 text-sm">
                        {label[language]}
                      </h5>
                    </div>
                    {/* Feedback items - de-emphasized individual entries */}
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

            {/* Warning note under feedback */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-200 dark:border-amber-800/50">
              <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
                {t('feedbackPerspectiveWarning')}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Distinction from Retro */}
      <div className="text-center px-4">
        <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
          {t('feedbackNotRetro')}
        </p>
      </div>
    </div>
  )
}
