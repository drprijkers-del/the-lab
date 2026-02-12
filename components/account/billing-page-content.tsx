'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { TierCard } from './tier-card'
import { getAccountBillingInfo, changeSubscriptionTier, cancelAccountSubscription, type AccountBillingInfo } from '@/domain/billing/actions'
import { TIER_ORDER, TIERS, isPaidTier, type SubscriptionTier } from '@/domain/billing/tiers'

interface BillingPageContentProps {
  billingInfo: AccountBillingInfo | null
}

type PaymentState = 'idle' | 'polling' | 'success' | 'timeout'

export function BillingPageContent({ billingInfo: initialBillingInfo }: BillingPageContentProps) {
  const t = useTranslation()
  const searchParams = useSearchParams()
  const [billingInfo, setBillingInfo] = useState(initialBillingInfo)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [downgradeTarget, setDowngradeTarget] = useState<SubscriptionTier | null>(null)
  const [upgradeTarget, setUpgradeTarget] = useState<SubscriptionTier | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const prevStatusRef = useRef(billingInfo?.billingStatus)
  const currentTier = billingInfo?.tier || 'free'
  const currentTierIdx = TIER_ORDER.indexOf(currentTier)

  // Detect post-checkout return via URL param
  const statusParam = searchParams.get('status')
  const returnUrl = searchParams.get('returnUrl') || '/teams'

  const [paymentState, setPaymentState] = useState<PaymentState>(() => {
    if (statusParam === 'pending') {
      // If webhook already processed before page load, show success immediately
      if (initialBillingInfo?.billingStatus === 'active' && isPaidTier(initialBillingInfo?.tier || 'free')) {
        return 'success'
      }
      return 'polling'
    }
    return 'idle'
  })

  const fetchBilling = useCallback(async () => {
    const info = await getAccountBillingInfo()
    if (info) {
      // Detect transition: pending_mandate → active
      if (prevStatusRef.current === 'pending_mandate' && info.billingStatus === 'active') {
        setPaymentState('success')
        window.history.replaceState({}, '', '/account/billing')
      }
      prevStatusRef.current = info.billingStatus
      setBillingInfo(info)
    }
  }, [])

  // Poll when pending mandate or post-checkout
  useEffect(() => {
    const isPostCheckout = paymentState === 'polling'
    if (billingInfo?.billingStatus !== 'pending_mandate' && !isPostCheckout) return

    const intervalMs = isPostCheckout ? 2000 : 3000
    const timeoutMs = isPostCheckout ? 60000 : 30000

    const interval = setInterval(fetchBilling, intervalMs)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (paymentState === 'polling') setPaymentState('timeout')
    }, timeoutMs)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [billingInfo?.billingStatus, paymentState, fetchBilling])

  const handleSelectTier = (selectedTier: SubscriptionTier) => {
    const selectedIdx = TIER_ORDER.indexOf(selectedTier)
    if (selectedIdx < currentTierIdx) {
      setDowngradeTarget(selectedTier)
      return
    }
    // Show upgrade confirmation with terms checkbox
    setTermsAccepted(false)
    setUpgradeTarget(selectedTier)
  }

  const handleConfirmUpgrade = async () => {
    if (!upgradeTarget || !termsAccepted) return
    const selectedTier = upgradeTarget
    setUpgradeTarget(null)

    setActionLoading(selectedTier)
    try {
      const result = await changeSubscriptionTier(selectedTier, returnUrl)
      if (result.success && result.checkoutUrl) {
        window.location.assign(result.checkoutUrl)
        return
      }
      if (result.error) {
        alert(result.error)
      }
      await fetchBilling()
    } catch (e) {
      console.error('Upgrade failed:', e)
      alert('Something went wrong. Please try again.')
    }
    setActionLoading(null)
  }

  const handleCancel = () => {
    setDowngradeTarget('free')
  }

  const handleConfirmDowngrade = async () => {
    if (!downgradeTarget) return
    const targetTier = downgradeTarget
    setDowngradeTarget(null)

    if (targetTier === 'free') {
      setActionLoading('cancel')
      const result = await cancelAccountSubscription()
      if (result.success) {
        await fetchBilling()
      }
      setActionLoading(null)
    } else {
      setActionLoading(targetTier)
      try {
        const result = await changeSubscriptionTier(targetTier, returnUrl)
        if (result.success && result.checkoutUrl) {
          window.location.assign(result.checkoutUrl)
          return
        }
        if (result.error) {
          alert(result.error)
        }
        await fetchBilling()
      } catch (e) {
        console.error('Downgrade failed:', e)
        alert('Something went wrong. Please try again.')
      }
      setActionLoading(null)
    }
  }

  if (!billingInfo) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-stone-200 dark:bg-stone-700 rounded" />
        <div className="h-4 w-72 bg-stone-200 dark:bg-stone-700 rounded" />
      </div>
    )
  }

  const { tier, billingStatus, billingPeriodEnd, teamCount, maxTeams, recentPayments } = billingInfo
  const isFree = tier === 'free'

  return (
    <div className="space-y-10">
      {/* Back link */}
      <Link
        href={returnUrl}
        className="inline-flex items-center text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 min-h-11 py-2"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {returnUrl.startsWith('/teams/') ? t('backToTeam') : t('teamsTitle')}
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t('accountBillingTitle')}</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">{t('accountBillingDesc')}</p>
      </div>

      {/* Post-checkout: Payment processing */}
      {paymentState === 'polling' && (
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-5 text-center">
          <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="font-medium text-cyan-700 dark:text-cyan-300">{t('billingProcessingPayment')}</p>
          <p className="text-sm text-cyan-600/80 dark:text-cyan-400/80 mt-1">{t('billingProcessingDesc')}</p>
        </div>
      )}

      {/* Post-checkout: Success */}
      {paymentState === 'success' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">{t('billingSuccessTitle')}</h3>
          <p className="text-sm text-green-700/80 dark:text-green-300/80">{t('billingSuccessDesc')}</p>
          <div className="mt-4 inline-block text-left">
            <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">{t('billingNowAvailable')}</p>
            <ul className="space-y-1 text-sm text-green-600 dark:text-green-400">
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {t('tierFeatureAllAngles')}
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {t('tierFeature30dTrends')}
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {t('tierFeatureHaRi')}
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {t('tierFeatureCoach')}
              </li>
            </ul>
          </div>
          {returnUrl !== '/teams' && (
            <div className="mt-4">
              <Link href={returnUrl} className="text-sm underline text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200">
                {t('backToTeam')} &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Post-checkout: Timeout */}
      {paymentState === 'timeout' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-700 dark:text-amber-300">{t('billingTimeoutMessage')}</p>
          <button
            onClick={() => window.location.reload()}
            className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
          >
            {t('billingRefresh')}
          </button>
        </div>
      )}

      {/* Pending state (non-checkout, e.g. page reload while pending) */}
      {billingStatus === 'pending_mandate' && paymentState === 'idle' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-amber-700 dark:text-amber-300">{t('billingPending')}</p>
        </div>
      )}

      {/* Current Plan Summary */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">{t('billingCurrentPlan')}</p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {isFree ? t('tierFree') : tier === 'scrum_master' ? t('tierScrumMaster') : tier === 'agile_coach' ? t('tierAgileCoach') : t('tierTransitionCoach')}
              </h2>
              {isPaidTier(tier) && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                  Pro
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {isFree ? t('tierFreeDesc') : t('tierPaidDesc')}
            </p>
          </div>
        </div>

        {/* Team usage */}
        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-stone-700 dark:text-stone-300">{t('tierTeamUsage')}</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{teamCount} / {maxTeams}</span>
          </div>
          <div className="h-2.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${teamCount >= maxTeams ? 'bg-amber-500' : 'bg-cyan-500'}`}
              style={{ width: `${Math.min(100, Math.max(8, (teamCount / maxTeams) * 100))}%` }}
            />
          </div>
          {teamCount >= maxTeams && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{t('tierTeamLimitHit')}</p>
          )}
        </div>

        {/* Status alerts */}
        {billingStatus === 'cancelled' && billingPeriodEnd && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {t('billingCancelledInfo')} {new Date(billingPeriodEnd).toLocaleDateString('nl-NL')}.
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              {t('billingCancelledDowngrade')}
            </p>
          </div>
        )}

        {billingStatus === 'past_due' && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <p className="text-sm text-red-700 dark:text-red-300">{t('billingPastDueInfo')}</p>
          </div>
        )}

        {/* Active subscription controls */}
        {isPaidTier(tier) && billingStatus === 'active' && (
          <div className="pt-4 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between">
            {billingPeriodEnd && (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('billingNextPayment')}: {new Date(billingPeriodEnd).toLocaleDateString('nl-NL')}
              </p>
            )}
            <Button variant="danger" size="sm" onClick={handleCancel} loading={actionLoading === 'cancel'}>
              {t('billingCancelSubscription')}
            </Button>
          </div>
        )}
      </div>

      {/* Tier Comparison */}
      <div>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">{t('tierCompareTitle')}</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">{t('tierCompareDesc')}</p>
        <p className="text-xs text-stone-400 dark:text-stone-500 italic mb-6">{t('tierCompareDisclaimer')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIER_ORDER.map((tierKey, idx) => (
            <TierCard
              key={tierKey}
              tier={tierKey}
              isCurrent={tierKey === tier}
              isDowngrade={idx < currentTierIdx}
              loading={actionLoading === tierKey}
              onSelect={handleSelectTier}
              recommended={isFree && tierKey === 'scrum_master'}
            />
          ))}
        </div>

        {/* Enterprise tier */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-5">
          <div>
            <h3 className="text-base font-bold text-stone-700 dark:text-stone-300">Enterprise</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{t('tierEnterpriseDesc')}</p>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mt-1">{t('tierEnterpriseTeams')}</p>
          </div>
          <Link
            href="/contact"
            className="shrink-0 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
          >
            {t('tierEnterpriseContact')}
          </Link>
        </div>
      </div>

      {/* Philosophy */}
      <div className="border-l-2 border-stone-300 dark:border-stone-600 pl-5 py-1">
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">{t('billingPhilosophyTitle')}</p>
        <ul className="space-y-2">
          {[t('billingPhilosophy1'), t('billingPhilosophy2'), t('billingPhilosophy3'), t('billingPhilosophy4')].map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <svg className="w-3.5 h-3.5 text-green-500 dark:text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* What's included in Pro? */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">{t('tierProIncludesTitle')}</h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">{t('tierProIncludesDesc')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {/* Pro features */}
          {[
            { icon: 'angles', label: t('tierDetailAngles') },
            { icon: 'trends', label: t('tierDetailTrends') },
            { icon: 'levels', label: t('tierDetailLevels') },
            { icon: 'coach', label: t('tierDetailCoach') },
          ].map((item) => (
            <div key={item.icon} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0 mt-0.5">
                {item.icon === 'angles' && (
                  <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
                {item.icon === 'trends' && (
                  <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )}
                {item.icon === 'levels' && (
                  <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {item.icon === 'coach' && (
                  <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Free vs Pro comparison */}
        <div className="mt-6 pt-6 border-t border-stone-200 dark:border-stone-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">Free</p>
              <ul className="space-y-2">
                {[t('tierFreeDetail1'), t('tierFreeDetail2'), t('tierFreeDetail3'), t('tierFreeDetail4')].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                    <svg className="w-4 h-4 shrink-0 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-3">Pro</p>
              <ul className="space-y-2">
                {[t('tierProDetail1'), t('tierProDetail2'), t('tierProDetail3'), t('tierProDetail4')].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                    <svg className="w-4 h-4 shrink-0 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* DEV: Billing Simulator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-stone-100 dark:bg-stone-900 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl p-4">
          <p className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400 mb-3">DEV — Billing Simulator</p>
          <div className="flex flex-wrap gap-2">
            {[
              { action: 'reset', label: 'Reset → Free', color: 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300' },
              { action: 'pending', label: 'Set Pending', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
              { action: 'activate', label: 'Activate SM', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
              { action: 'cancel', label: 'Cancel Sub', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
            ].map((btn) => (
              <button
                key={btn.action}
                onClick={async () => {
                  await fetch('/api/dev/billing-sim', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: btn.action }),
                  })
                  await fetchBilling()
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${btn.color} hover:opacity-80 transition-opacity`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[10px] text-stone-400 dark:text-stone-500 self-center mr-1">Tier:</span>
            {[
              { tier: 'scrum_master', label: 'SM', color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' },
              { tier: 'agile_coach', label: 'AC', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
              { tier: 'transition_coach', label: 'TC', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
            ].map((btn) => (
              <button
                key={btn.tier}
                onClick={async () => {
                  await fetch('/api/dev/billing-sim', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'set_tier', tier: btn.tier }),
                  })
                  await fetchBilling()
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${btn.color} hover:opacity-80 transition-opacity`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-2">
            Coach test: Set tier (SM/AC/TC) → ga naar team → coach tab. AI Coach = AC/TC tier.
          </p>
        </div>
      )}

      {/* Payment History */}
      {recentPayments.length > 0 && (
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('billingPaymentHistory')}</h3>
          <div className="space-y-2">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-700 last:border-0">
                <div>
                  <p className="text-sm text-stone-700 dark:text-stone-300">&euro;{payment.amount}</p>
                  <p className="text-xs text-stone-400">{new Date(payment.createdAt).toLocaleDateString('nl-NL')}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  payment.status === 'paid'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : payment.status === 'failed' || payment.status === 'expired'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                }`}>
                  {payment.status === 'paid' ? t('billingPaymentPaid')
                    : payment.status === 'failed' || payment.status === 'expired' ? t('billingPaymentFailed')
                    : t('billingPaymentPending')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Downgrade Confirmation Modal */}
      {downgradeTarget && (() => {
        const toFree = downgradeTarget === 'free'
        const targetName = toFree ? t('tierFree')
          : downgradeTarget === 'scrum_master' ? t('tierScrumMaster')
          : downgradeTarget === 'agile_coach' ? t('tierAgileCoach')
          : t('tierTransitionCoach')
        const targetTeams = TIERS[downgradeTarget].maxTeams

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setDowngradeTarget(null)}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 w-full max-w-md p-6 space-y-5">
              {/* Header */}
              <div>
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {toFree ? t('downgradeToFreeTitle') : t('downgradeTierTitle')}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {toFree ? t('downgradeToFreeDesc') : t('downgradeTierDesc').replace('{tier}', targetName)}
                </p>
              </div>

              {/* What changes */}
              <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('downgradeWhatChanges')}</p>
                <ul className="space-y-2">
                  {toFree ? (
                    <>
                      <li className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
                        <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {t('downgradeTeamsTo').replace('{n}', '1')}
                      </li>
                      <li className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
                        <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {t('downgradeLoseAngles')}
                      </li>
                      <li className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
                        <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {t('downgradeLoseCoach')}
                      </li>
                      <li className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
                        <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {t('downgradeHaRiReset')}
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
                        <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {t('downgradeTeamsTo').replace('{n}', String(targetTeams))}
                      </li>
                      <li className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
                        <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {t('downgradeCoachChange')}
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* No lock-in message */}
              <div className="flex items-start gap-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {billingPeriodEnd
                    ? t('downgradeKeepAccess').replace('{date}', new Date(billingPeriodEnd).toLocaleDateString('nl-NL'))
                    : t('downgradeImmediate')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setDowngradeTarget(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                >
                  {t('downgradeCancel')}
                </button>
                <Button
                  onClick={handleConfirmDowngrade}
                  loading={actionLoading === downgradeTarget || actionLoading === 'cancel'}
                  variant="danger"
                  size="sm"
                  className="flex-1"
                >
                  {toFree ? t('downgradeConfirmFree') : t('downgradeConfirmTier')}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Upgrade Confirmation Modal (terms acceptance) */}
      {upgradeTarget && (() => {
        const targetName = upgradeTarget === 'scrum_master' ? t('tierScrumMaster')
          : upgradeTarget === 'agile_coach' ? t('tierAgileCoach')
          : t('tierTransitionCoach')
        const price = TIERS[upgradeTarget].price

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setUpgradeTarget(null)}
            />
            <div className="relative bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 w-full max-w-md p-6 space-y-5">
              <div>
                <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {t('upgradeConfirmTitle').replace('{tier}', targetName)}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {t('upgradeConfirmDesc').replace('{price}', price)}
                </p>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {t('upgradeTermsAgree')}{' '}
                  <Link href="/terms" target="_blank" className="underline text-cyan-600 dark:text-cyan-400 hover:text-cyan-500">
                    {t('footerTerms').toLowerCase()}
                  </Link>
                  {' '}{t('upgradeTermsAnd')}{' '}
                  <Link href="/privacy" target="_blank" className="underline text-cyan-600 dark:text-cyan-400 hover:text-cyan-500">
                    {t('footerPrivacy').toLowerCase()}
                  </Link>
                </span>
              </label>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setUpgradeTarget(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                >
                  {t('downgradeCancel')}
                </button>
                <Button
                  onClick={handleConfirmUpgrade}
                  loading={actionLoading === upgradeTarget}
                  disabled={!termsAccepted}
                  size="sm"
                  className="flex-1"
                >
                  {t('upgradeConfirmButton')}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
