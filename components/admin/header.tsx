'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslation, useLanguage } from '@/lib/i18n/context'
import { useTheme } from '@/lib/theme/context'
import { Button } from '@/components/ui/button'

export function AdminHeader() {
  const t = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [showExpertModal, setShowExpertModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

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
          <div className="flex items-center justify-between h-14">
            {/* Brand - text only, no emoji */}
            <Link href="/teams" className="font-bold text-lg text-stone-900 dark:text-stone-100" aria-label="Pulse - Home">
              Pulse
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {/* Navigation removed - Teams/Backlog are tabs within the page */}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExpertModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
                >
                  {t('contactExpert')}
                </button>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors"
                  aria-label="Toggle theme"
                >
                  {mounted && (
                    theme === 'dark' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )
                  )}
                </button>
                <button
                  onClick={() => setLanguage(language === 'nl' ? 'en' : 'nl')}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors uppercase"
                >
                  {language}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  {t('adminLogout')}
                </button>
              </div>
            </div>

            {/* Mobile: Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -mr-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-stone-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
              <span className="font-semibold text-stone-900 dark:text-stone-100">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="p-2">
              <Link
                href="/teams"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
              >
                Teams
              </Link>
            </div>

            {/* Settings */}
            <div className="p-2">
              {/* Language Toggle */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-stone-600 dark:text-stone-400">{t('language')}</span>
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setLanguage('nl')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      language === 'nl'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    NL
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      language === 'en'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-stone-600 dark:text-stone-400">{t('theme')}</span>
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      mounted && theme === 'light'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      mounted && theme === 'dark'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-stone-200 dark:border-stone-700 my-2" />

            {/* Contact & Logout */}
            <div className="p-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowExpertModal(true)
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                {t('contactExpert')}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {t('adminLogout')}
              </button>
            </div>

            {/* Coming Next Section */}
            <div className="border-t border-stone-200 dark:border-stone-700 my-2" />
            <div className="p-2">
              <div className="px-4 py-2">
                <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                  {t('comingNext')}
                </span>
              </div>
              <div className="space-y-1">
                <div className="px-4 py-2 text-sm text-stone-400 dark:text-stone-500">
                  Leadership Dashboard
                </div>
                <div className="px-4 py-2 text-sm text-stone-400 dark:text-stone-500">
                  Portfolio View
                </div>
                <div className="px-4 py-2 text-sm text-stone-400 dark:text-stone-500">
                  Obeya Integration
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                href={`mailto:${t('contactExpertEmail')}?subject=Pulse - Coaching Request`}
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
