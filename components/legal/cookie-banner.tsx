'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'

const COOKIE_CONSENT_KEY = 'pulse_cookie_consent'

export function CookieBanner() {
  const t = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined')
    setVisible(false)
  }

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-md mx-auto bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl leading-none mt-0.5" aria-hidden="true">🍪</span>
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            {t('cookieBannerText')}{' '}
            <Link href="/cookies" className="underline text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              {t('cookieBannerLearnMore')}
            </Link>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            {t('cookieBannerDecline')}
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
          >
            {t('cookieBannerAccept')}
          </button>
        </div>
      </div>
    </div>
  )
}
