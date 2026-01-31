'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'

export function AdminHeader() {
  const t = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [showExpertModal, setShowExpertModal] = useState(false)

  // Active state: /teams or /session (both are admin areas)
  const isActive = pathname?.startsWith('/teams') || pathname?.startsWith('/session')

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Continue with redirect even if API fails
    }
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700" role="banner">
        <nav className="max-w-4xl mx-auto px-4" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16">
            {/* Logo and brand */}
            <div className="flex items-center gap-6">
              <Link href="/teams" className="flex items-center gap-2" aria-label="Team Lab - Teams">
                <span className="text-2xl" aria-hidden="true">🧪</span>
                <span className="font-bold text-lg text-stone-900 dark:text-stone-100">Team Lab</span>
              </Link>

              {/* Simple navigation - just Teams */}
              <div className="hidden sm:flex items-center">
                <Link
                  href="/teams"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  Teams
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Contact Expert Button */}
              <button
                onClick={() => setShowExpertModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
                aria-label={t('contactExpert')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {t('contactExpert')}
              </button>
              <ThemeToggle />
              <LanguageToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Log out">
                {t('adminLogout')}
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Expert Contact Modal */}
      {showExpertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowExpertModal(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{t('contactExpertTitle')}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400">{t('contactExpertMessage')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowExpertModal(false)}
              >
                {t('cancel')}
              </Button>
              <a
                href={`mailto:${t('contactExpertEmail')}?subject=Team Lab - Coaching Request`}
                className="flex-1"
              >
                <Button className="w-full">
                  {t('contactExpertButton')}
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
