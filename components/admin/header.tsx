'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslation, useLanguage } from '@/lib/i18n/context'
import { useTheme } from '@/lib/theme/context'
import { Button } from '@/components/ui/button'

interface Team {
  id: string
  name: string
  slug: string
}

interface AdminHeaderProps {
  currentTeam?: Team | null
  allTeams?: Team[]
}

type NavMode = 'vibe' | 'ceremonies' | 'feedback' | 'coach' | 'modules' | 'settings'

// Inner component that uses useSearchParams
function AdminHeaderInner({ currentTeam, allTeams = [] }: AdminHeaderProps) {
  const t = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showExpertModal, setShowExpertModal] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showTeamSelector, setShowTeamSelector] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Determine active mode from URL
  const currentTab = searchParams.get('tab') as NavMode | null
  const activeMode: NavMode | null = currentTab && ['vibe', 'ceremonies', 'feedback', 'coach', 'modules', 'settings'].includes(currentTab)
    ? currentTab as NavMode
    : null

  // Check if we're on a team detail page
  const isOnTeamPage = pathname.startsWith('/teams/') && pathname !== '/teams' && !pathname.endsWith('/new')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setShowSettingsMenu(false)
    setShowTeamSelector(false)
  }, [pathname])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSettingsMenu(false)
      setShowTeamSelector(false)
    }
    if (showSettingsMenu || showTeamSelector) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showSettingsMenu, showTeamSelector])

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Continue with redirect even if API fails
    }
    router.push('/')
    router.refresh()
  }

  function navigateToMode(mode: NavMode) {
    if (currentTeam) {
      router.push(`/teams/${currentTeam.id}?tab=${mode}`)
    }
  }

  function switchTeam(teamId: string) {
    const currentMode = activeMode || 'vibe'
    router.push(`/teams/${teamId}?tab=${currentMode}`)
    setShowTeamSelector(false)
  }

  const navModes: { key: NavMode; label: string }[] = [
    { key: 'vibe', label: t('teamsDetailVibe') },
    { key: 'ceremonies', label: t('teamsDetailCeremonies') },
    { key: 'feedback', label: t('feedbackTitle') },
    { key: 'coach', label: t('coachQuestionsTab') },
    { key: 'modules', label: t('teamsDetailModules') },
    { key: 'settings', label: t('teamsDetailSettings') },
  ]

  return (
    <>
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700 sticky top-0 z-40" role="banner">
        <nav className="max-w-6xl mx-auto px-4" aria-label="Main navigation">
          <div className="flex items-center h-14 gap-1">
            {/* Brand */}
            <Link
              href="/teams"
              className="font-bold text-lg text-stone-900 dark:text-stone-100 shrink-0"
              aria-label="Pulse - Home"
            >
              Pulse
            </Link>

            {/* Team Selector (when on team page) */}
            {isOnTeamPage && currentTeam && (
              <div className="relative ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowTeamSelector(!showTeamSelector)
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                >
                  <span className="text-stone-400 dark:text-stone-500">/</span>
                  <span className="max-w-[120px] truncate">{currentTeam.name}</span>
                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Team Dropdown */}
                {showTeamSelector && allTeams.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-50">
                    <div className="px-3 py-2 text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                      {t('switchTeam')}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {allTeams.map((team) => (
                        <button
                          key={team.id}
                          onClick={() => switchTeam(team.id)}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            team.id === currentTeam.id
                              ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                          }`}
                        >
                          {team.name}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-stone-200 dark:border-stone-700 mt-1 pt-1">
                      <Link
                        href="/teams"
                        className="block px-3 py-2 text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700"
                      >
                        {t('viewAllTeams')}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Desktop: Mode Navigation (only on team pages) */}
            {isOnTeamPage && currentTeam && (
              <div className="hidden md:flex items-center gap-1 ml-4 border-l border-stone-200 dark:border-stone-700 pl-4">
                {navModes.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => navigateToMode(key)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      activeMode === key
                        ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Desktop: Global Navigation (when not on team page) */}
            {!isOnTeamPage && (
              <div className="hidden md:flex items-center gap-1 ml-4 border-l border-stone-200 dark:border-stone-700 pl-4">
                <Link
                  href="/teams"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    pathname === '/teams'
                      ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {t('teamsTitle')}
                </Link>
                <Link
                  href="/backlog"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    pathname === '/backlog'
                      ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {t('backlogTab')}
                </Link>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Desktop: Right Side Actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Backlog link - only show when on team page (global nav handles it otherwise) */}
              {isOnTeamPage && (
                <Link
                  href="/backlog"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {t('backlogTab')}
                </Link>
              )}

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSettingsMenu(!showSettingsMenu)
                  }}
                  className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors"
                  aria-label="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                {/* Settings Dropdown Menu */}
                {showSettingsMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-50">
                    {/* Theme */}
                    <div className="px-3 py-2">
                      <div className="text-xs font-medium text-stone-400 dark:text-stone-500 mb-2">{t('theme')}</div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setTheme('light')}
                          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            mounted && theme === 'light'
                              ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400'
                              : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          Light
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            mounted && theme === 'dark'
                              ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400'
                              : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>

                    {/* Language */}
                    <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-700">
                      <div className="text-xs font-medium text-stone-400 dark:text-stone-500 mb-2">{t('language')}</div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setLanguage('nl')}
                          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            language === 'nl'
                              ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400'
                              : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          NL
                        </button>
                        <button
                          onClick={() => setLanguage('en')}
                          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            language === 'en'
                              ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400'
                              : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          EN
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-stone-100 dark:border-stone-700 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setShowSettingsMenu(false)
                          setShowExpertModal(true)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700"
                      >
                        {t('contactExpert')}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {t('adminLogout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: Hamburger Menu */}
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
            className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-stone-900 shadow-xl overflow-y-auto"
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

            {/* Mode Navigation (if on team page) */}
            {isOnTeamPage && currentTeam && (
              <div className="p-2 border-b border-stone-200 dark:border-stone-700">
                <div className="px-3 py-2 text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                  {currentTeam.name}
                </div>
                {navModes.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      navigateToMode(key)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      activeMode === key
                        ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Navigation Links */}
            <div className="p-2">
              <Link
                href="/teams"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('teamsTitle')}
              </Link>
              <Link
                href="/backlog"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t('backlogTab')}
              </Link>
            </div>

            {/* Settings */}
            <div className="p-2 border-t border-stone-200 dark:border-stone-700">
              {/* Language Toggle */}
              <div className="flex items-center justify-between px-3 py-2.5">
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
              <div className="flex items-center justify-between px-3 py-2.5">
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

            {/* Contact & Logout */}
            <div className="p-2 border-t border-stone-200 dark:border-stone-700">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowExpertModal(true)
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                {t('contactExpert')}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {t('adminLogout')}
              </button>
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

// Wrapper component with Suspense boundary for useSearchParams
export function AdminHeader(props: AdminHeaderProps) {
  return (
    <Suspense fallback={
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700 h-14" />
    }>
      <AdminHeaderInner {...props} />
    </Suspense>
  )
}
