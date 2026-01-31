'use client'

import { useState, useEffect } from 'react'
import { getShareLink, regenerateInviteLink } from '@/domain/teams/actions'
import { useTranslation } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface ShareLinkSectionProps {
  teamId: string
  teamSlug: string
}

export function ShareLinkSection({ teamId, teamSlug }: ShareLinkSectionProps) {
  const t = useTranslation()
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  useEffect(() => {
    async function loadShareLink() {
      const link = await getShareLink(teamId)
      if (link) {
        setShareUrl(link.url)
      }
      setLoading(false)
    }
    loadShareLink()
  }, [teamId])

  async function handleRegenerate() {
    setRegenerating(true)
    const result = await regenerateInviteLink(teamId)

    if (result.success && result.token) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      setShareUrl(`${baseUrl}/t/${teamSlug}?k=${result.token}`)
      setResetSuccess(true)
      setTimeout(() => setResetSuccess(false), 3000)
    }

    setRegenerating(false)
    setShowModal(false)
  }

  async function handleCopy() {
    if (!shareUrl) return

    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">{t('shareTitle')}</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            {t('shareDescription')}
          </p>

          {loading ? (
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ) : shareUrl ? (
            <div className="space-y-3">
              {/* Clean link display */}
              <div className="flex items-center gap-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-cyan-900">{t('shareReady')}</div>
                  <div className="text-xs text-cyan-600 truncate">/t/{teamSlug}</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleCopy}
                  className="flex-1"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('shareCopied')}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {t('shareCopy')}
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.open(shareUrl, '_blank')}
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {t('shareOpen')}
                </Button>
              </div>

              {/* Success message after reset */}
              {resetSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-green-700">{t('shareResetSuccess')}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-stone-50 rounded-xl text-center text-sm text-stone-500">
              {t('shareNoLink')}
            </div>
          )}

          {/* Advanced section - collapsed by default */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {t('shareAdvanced')}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 animate-fade-in">
                {/* Info card */}
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-amber-900 mb-1">{t('shareResetTitle')}</h4>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        {t('shareResetInfo')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reset button */}
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors group"
                >
                  <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('shareResetButton')}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
            {/* Warning icon */}
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {t('shareResetConfirm')}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {t('shareResetWarning')}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                {t('shareResetCancel')}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {regenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('loading')}
                  </>
                ) : (
                  t('shareResetYes')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
