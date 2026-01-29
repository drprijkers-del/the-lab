'use client'

import { useState, useEffect } from 'react'
import { getShareLink, regenerateInviteLink } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface ShareLinkSectionProps {
  teamId: string
  teamSlug: string
}

export function ShareLinkSection({ teamId, teamSlug }: ShareLinkSectionProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)

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
    }

    setRegenerating(false)
  }

  async function handleCopy() {
    if (!shareUrl) return

    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-gray-900">Share link</h2>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">
          Deel deze link met je team om ze toegang te geven tot de mood check-in.
        </p>

        {loading ? (
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <div className="space-y-3">
            {/* Link display - word wrap on mobile */}
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-600 font-mono break-all">
              {shareUrl || 'Geen actieve link'}
            </div>

            {/* Action buttons - stack on mobile */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => shareUrl && window.open(shareUrl, '_blank')}
                disabled={!shareUrl}
                className="flex-1"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Mood Meter
              </Button>
              <Button
                variant="secondary"
                onClick={handleCopy}
                disabled={!shareUrl}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Gekopieerd!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Kopieer link
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            loading={regenerating}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Nieuwe link genereren
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            Dit maakt de huidige link ongeldig.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
