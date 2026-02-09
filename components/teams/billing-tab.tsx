'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'
import { getBillingInfo, startSubscription, cancelSubscription, type BillingInfo } from '@/domain/billing/actions'

interface BillingTabProps {
  teamId: string
  teamPlan: 'free' | 'pro'
}

export function BillingTab({ teamId, teamPlan }: BillingTabProps) {
  const t = useTranslation()
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchBilling = useCallback(async () => {
    const info = await getBillingInfo(teamId)
    setBillingInfo(info)
    setLoading(false)
  }, [teamId])

  useEffect(() => {
    let cancelled = false
    getBillingInfo(teamId).then((info) => {
      if (!cancelled) {
        setBillingInfo(info)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [teamId])

  // Poll when pending mandate (waiting for webhook)
  useEffect(() => {
    if (billingInfo?.billingStatus !== 'pending_mandate') return
    const interval = setInterval(() => {
      getBillingInfo(teamId).then((info) => {
        if (info) {
          setBillingInfo(info)
        }
      })
    }, 3000)
    const timeout = setTimeout(() => clearInterval(interval), 30000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [billingInfo?.billingStatus, teamId])

  const handleUpgrade = async () => {
    setActionLoading('upgrade')
    const result = await startSubscription(teamId)
    if (result.success && result.checkoutUrl) {
      window.location.href = result.checkoutUrl
    }
    setActionLoading(null)
  }

  const handleCancel = async () => {
    if (!confirm(t('billingCancelConfirm'))) return
    setActionLoading('cancel')
    const result = await cancelSubscription(teamId)
    if (result.success) {
      await fetchBilling()
    }
    setActionLoading(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 animate-pulse">
          <div className="h-6 w-40 bg-stone-200 dark:bg-stone-700 rounded mb-4" />
          <div className="h-4 w-64 bg-stone-200 dark:bg-stone-700 rounded" />
        </div>
      </div>
    )
  }

  const plan = billingInfo?.plan ?? teamPlan
  const isPro = plan === 'pro'
  const status = billingInfo?.billingStatus ?? 'none'

  return (
    <div className="space-y-6">
      {/* Pending state */}
      {status === 'pending_mandate' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-amber-700 dark:text-amber-300">{t('billingPending')}</p>
        </div>
      )}

      {/* Plan Card */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">{t('billingCurrentPlan')}</p>
            <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {isPro ? t('billingProPlan') : t('billingFreePlan')}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {isPro ? t('billingProPlanDesc') : t('billingFreePlanDesc')}
            </p>
          </div>
          {isPro && (
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
              {t('billingProBadge')}
            </span>
          )}
        </div>

        {/* Status info */}
        {status === 'cancelled' && billingInfo?.billingPeriodEnd && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {t('billingCancelledInfo')} {new Date(billingInfo.billingPeriodEnd).toLocaleDateString()}
            </p>
          </div>
        )}

        {status === 'past_due' && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{t('billingPastDueInfo')}</p>
          </div>
        )}

        {/* Actions */}
        {!isPro && status !== 'pending_mandate' && (
          <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
            <p className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1">{t('billingPriceLabel')}</p>
            <Button onClick={handleUpgrade} loading={actionLoading === 'upgrade'} className="mt-3">
              {t('billingUpgradeToPro')}
            </Button>
          </div>
        )}

        {isPro && status === 'active' && (
          <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
            {billingInfo?.billingPeriodEnd && (
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
                {t('billingNextPayment')}: {new Date(billingInfo.billingPeriodEnd).toLocaleDateString()}
              </p>
            )}
            <Button variant="danger" size="sm" onClick={handleCancel} loading={actionLoading === 'cancel'}>
              {t('billingCancelSubscription')}
            </Button>
          </div>
        )}

        {/* Reactivate after past_due */}
        {status === 'past_due' && (
          <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
            <Button onClick={handleUpgrade} loading={actionLoading === 'upgrade'}>
              {t('billingUpgradeToPro')}
            </Button>
          </div>
        )}
      </div>

      {/* Pro Features */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('billingProFeatures')}</h3>

        {/* Core features */}
        <ul className="space-y-3 mb-6">
          {[
            t('billingFeatureLevels'),
            t('billingFeatureTrends'),
            t('billingFeatureCoach'),
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <svg className={`w-5 h-5 mt-0.5 shrink-0 ${isPro ? 'text-green-500' : 'text-stone-300 dark:text-stone-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isPro ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                )}
              </svg>
              <span className="text-sm text-stone-700 dark:text-stone-300">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Pro angles grid */}
        <div className="border-t border-stone-200 dark:border-stone-700 pt-4">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">{t('billingProAnglesTitle')}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'refinement', label: t('angleRefinement') },
              { key: 'ownership', label: t('angleOwnership') },
              { key: 'technical_excellence', label: t('angleTechnicalExcellence') },
              { key: 'demo', label: t('angleDemo') },
              { key: 'obeya', label: t('angleObeya') },
              { key: 'dependencies', label: t('angleDependencies') },
              { key: 'psychological_safety', label: t('anglePsychSafety') },
              { key: 'devops', label: t('angleDevOps') },
              { key: 'stakeholder', label: t('angleStakeholder') },
              { key: 'leadership', label: t('angleLeadership') },
            ].map((angle) => (
              <div key={angle.key} className="flex items-center gap-2 py-1.5">
                <svg className={`w-4 h-4 shrink-0 ${isPro ? 'text-green-500' : 'text-stone-300 dark:text-stone-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isPro ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  )}
                </svg>
                <span className="text-sm text-stone-700 dark:text-stone-300">{angle.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment History */}
      {billingInfo?.recentPayments && billingInfo.recentPayments.length > 0 && (
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('billingPaymentHistory')}</h3>
          <div className="space-y-2">
            {billingInfo.recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-700 last:border-0">
                <div>
                  <p className="text-sm text-stone-700 dark:text-stone-300">€{payment.amount}</p>
                  <p className="text-xs text-stone-400">{new Date(payment.createdAt).toLocaleDateString()}</p>
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
    </div>
  )
}
