'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'
import type { BacklogItem, ReleaseNote } from '@/domain/backlog/actions'
import { submitWish } from '@/domain/backlog/actions'

interface BacklogDisplayProps {
  items: BacklogItem[]
  releases: ReleaseNote[]
}

type Tab = 'review' | 'exploring' | 'building' | 'releases' | 'not_doing'
type WishState = 'browsing' | 'form' | 'submitting' | 'success'

export function BacklogDisplay({ items, releases }: BacklogDisplayProps) {
  const t = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('review')

  // Wish form state
  const [wishState, setWishState] = useState<WishState>('browsing')
  const [wishText, setWishText] = useState('')
  const [wishWhy, setWishWhy] = useState('')
  const [wishError, setWishError] = useState('')

  // Group items
  const exploring = items.filter(i => i.status === 'exploring')
  const building = items.filter(i => i.status === 'decided' && i.decision === 'building')
  const done = items.filter(i => i.status === 'decided' && i.decision === 'done')
  const notDoing = items.filter(i => i.status === 'decided' && i.decision === 'not_doing')
  const review = items.filter(i => i.status === 'review')

  // Extract version from our_take (format: "Released in vX.X.X - ...")
  const extractVersion = (text: string | null): string | null => {
    if (!text) return null
    const match = text.match(/^Released in (v[\d.]+)/)
    return match ? match[1] : null
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'review', label: 'Under Review', count: review.length },
    { id: 'exploring', label: 'Exploring', count: exploring.length },
    { id: 'building', label: 'Building', count: building.length },
    { id: 'releases', label: 'Releases', count: releases.length + done.length },
    { id: 'not_doing', label: 'Not Doing', count: notDoing.length },
  ]

  const handleSubmitWish = async () => {
    if (!wishText.trim()) {
      setWishError(t('wishRequired'))
      return
    }

    setWishState('submitting')

    const result = await submitWish(wishText.trim(), wishWhy.trim())

    if (!result.success) {
      setWishError(result.error || 'Something went wrong')
      setWishState('form')
      return
    }

    setWishState('success')
    setWishText('')
    setWishWhy('')
  }

  const handleCancelForm = () => {
    setWishState('browsing')
    setWishText('')
    setWishWhy('')
    setWishError('')
  }

  const handleCloseSuccess = () => {
    setWishState('browsing')
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      ux: 'UX',
      statements: 'Statements',
      analytics: 'Analytics',
      integration: 'Integration',
      features: 'Features',
    }
    return labels[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ux: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      statements: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      analytics: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
      integration: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      features: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    }
    return colors[category] || 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-400'
  }

  const getProductBadge = (product: string) => {
    const config: Record<string, { label: string; color: string }> = {
      delta: { label: 'Delta', color: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' },
      pulse: { label: 'Pulse', color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
      shared: { label: 'Shared', color: 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700' },
    }
    return config[product] || config.shared
  }

  const renderItems = (itemList: BacklogItem[]) => {
    if (itemList.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-stone-400 dark:text-stone-500">No items yet</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {itemList.map((item) => {
          const productBadge = getProductBadge(item.product)
          return (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded border ${productBadge.color}`}>
                      {productBadge.label}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(item.category)}`}>
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-stone-900 dark:text-stone-100">{item.title_en}</h3>
                    {item.source_en && (
                      <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{item.source_en}</p>
                    )}
                    {item.our_take_en && (
                      <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 italic">
                        &ldquo;{item.our_take_en}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  const renderReleases = () => {
    if (releases.length === 0 && done.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-stone-400 dark:text-stone-500">No releases yet</p>
          </CardContent>
        </Card>
      )
    }

    // Group done items by version
    const doneByVersion: Record<string, BacklogItem[]> = {}
    done.forEach(item => {
      const version = extractVersion(item.our_take_en)
      if (version) {
        const versionKey = version.replace('v', '')
        if (!doneByVersion[versionKey]) doneByVersion[versionKey] = []
        doneByVersion[versionKey].push(item)
      }
    })

    return (
      <div className="space-y-6">
        {releases.map((release) => {
          const productBadge = getProductBadge(release.product)
          const releaseDoneItems = doneByVersion[release.version] || []

          return (
            <Card key={release.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded border ${productBadge.color}`}>
                    {productBadge.label}
                  </span>
                  <span className="text-xs font-mono bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-2 py-1 rounded">
                    v{release.version}
                  </span>
                  <span className="text-sm text-stone-400 dark:text-stone-500">
                    {new Date(release.released_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="font-medium text-stone-900 dark:text-stone-100">{release.title_en}</h3>
                {release.description_en && (
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{release.description_en}</p>
                )}

                {/* Release note changes */}
                {release.changes && release.changes.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {release.changes.map((change, i) => (
                      <li key={i} className="text-sm text-stone-600 dark:text-stone-300 flex items-start gap-2">
                        <span className="text-emerald-500 dark:text-emerald-400 mt-0.5">+</span>
                        {change.en}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Completed backlog items for this release */}
                {releaseDoneItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
                      Completed from backlog
                    </p>
                    <ul className="space-y-1">
                      {releaseDoneItems.map((item) => (
                        <li key={item.id} className="text-sm text-stone-600 dark:text-stone-300 flex items-start gap-2">
                          <span className="text-cyan-500 dark:text-cyan-400 mt-0.5">✓</span>
                          <span>
                            {item.title_en}
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${getCategoryColor(item.category)}`}>
                              {getCategoryLabel(item.category)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      {/* Tab navigation - at top for visibility */}
      <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }
            `}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-xs text-stone-400 dark:text-stone-500">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Wish submission section - only on active tabs */}
      {wishState === 'browsing' && (activeTab === 'review' || activeTab === 'exploring' || activeTab === 'building') && (
        <Card className="mb-8 border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/20">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-bold text-stone-900 dark:text-stone-100">{t('wishTitle')}</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  Have an idea or suggestion? We&apos;d love to hear it!
                </p>
              </div>
              <Button onClick={() => setWishState('form')}>
                {t('wishAddButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wish form */}
      {(wishState === 'form' || wishState === 'submitting') && (activeTab === 'review' || activeTab === 'exploring' || activeTab === 'building') && (
        <Card className="mb-8 border-cyan-200 dark:border-cyan-800">
          <CardContent className="py-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">{t('wishTitle')}</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="wish-text" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t('wishLabel')}
                </label>
                <textarea
                  id="wish-text"
                  value={wishText}
                  onChange={(e) => {
                    setWishText(e.target.value)
                    setWishError('')
                  }}
                  placeholder={t('wishPlaceholder')}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={wishState === 'submitting'}
                />
                {wishError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{wishError}</p>
                )}
              </div>

              <div>
                <label htmlFor="wish-why" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t('wishWhyLabel')}
                </label>
                <textarea
                  id="wish-why"
                  value={wishWhy}
                  onChange={(e) => setWishWhy(e.target.value)}
                  placeholder={t('wishWhyPlaceholder')}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={wishState === 'submitting'}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSubmitWish}
                  disabled={wishState === 'submitting'}
                  className="flex-1"
                >
                  {wishState === 'submitting' ? t('wishSubmitting') : t('wishSubmit')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCancelForm}
                  disabled={wishState === 'submitting'}
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success message */}
      {wishState === 'success' && (activeTab === 'review' || activeTab === 'exploring' || activeTab === 'building') && (
        <Card className="mb-8 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30">
          <CardContent className="py-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2">{t('wishThanks')}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">{t('wishConfirmation')}</p>
            <Button variant="secondary" onClick={handleCloseSuccess}>
              {t('wishClose')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab content - matches admin kanban columns */}
      {activeTab === 'review' && (
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
            New requests we&apos;re evaluating. Your input helps us prioritize!
          </p>
          {renderItems(review)}
        </div>
      )}

      {activeTab === 'exploring' && (
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
            Ideas and features we&apos;re actively researching and designing.
          </p>
          {renderItems(exploring)}
        </div>
      )}

      {activeTab === 'building' && (
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
            Decided to build. Coming soon!
          </p>
          {renderItems(building)}
        </div>
      )}

      {activeTab === 'releases' && (
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
            Completed and shipped. See what we&apos;ve released.
          </p>
          {renderReleases()}
        </div>
      )}

      {activeTab === 'not_doing' && (
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
            We considered these but decided against them. Here&apos;s why.
          </p>
          {renderItems(notDoing)}
        </div>
      )}
    </div>
  )
}
