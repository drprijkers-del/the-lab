'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { useTranslation, useLanguage } from '@/lib/i18n/context'
import { useTheme } from '@/lib/theme/context'
import { Button } from '@/components/ui/button'
import { isPaidTier, type SubscriptionTier } from '@/domain/billing/tiers'

interface Team {
  id: string
  name: string
  slug: string
}

interface AdminHeaderProps {
  currentTeam?: Team | null
  allTeams?: Team[]
  userEmail?: string
  userName?: string | null
  userRole?: 'super_admin' | 'scrum_master'
  subscriptionTier?: SubscriptionTier
}

type NavMode = 'home' | 'vibe' | 'wow' | 'feedback' | 'coach' | 'settings'

// Inner component that uses useSearchParams
function AdminHeaderInner({ currentTeam, allTeams = [], userEmail, userName, userRole, subscriptionTier = 'free' }: AdminHeaderProps) {
  const t = useTranslation()
  const { signOut } = useClerk()

  // Show first name, fall back to email prefix
  const username = userName || (userEmail ? userEmail.split('@')[0] : null)
  const isSuperAdmin = userRole === 'super_admin'
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showExpertModal, setShowExpertModal] = useState(false)
  const [showCoachDropdown, setShowCoachDropdown] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showTeamSelector, setShowTeamSelector] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showRemindersInfo, setShowRemindersInfo] = useState(false)
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Check if we're on a team detail page
  const isOnTeamPage = pathname.startsWith('/teams/') && pathname !== '/teams' && !pathname.endsWith('/new')

  // Determine active mode from URL (default to 'home' on team pages)
  const currentTab = searchParams.get('tab') as NavMode | null
  const activeMode: NavMode = currentTab && ['home', 'vibe', 'wow', 'feedback', 'coach', 'modules', 'settings'].includes(currentTab)
    ? currentTab as NavMode
    : isOnTeamPage ? 'home' : 'home'

  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration safety: must be false on server
  useEffect(() => { setMounted(true) }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- reset menus on navigation */
  useEffect(() => {
    setMobileMenuOpen(false)
    setShowSettingsMenu(false)
    setShowTeamSelector(false)
  }, [pathname])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSettingsMenu(false)
      setShowTeamSelector(false)
      setShowCoachDropdown(false)
      setShowMoreMenu(false)
    }
    if (showSettingsMenu || showTeamSelector || showCoachDropdown || showMoreMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showSettingsMenu, showTeamSelector, showCoachDropdown, showMoreMenu])

  async function handleLogout() {
    await signOut({ redirectUrl: '/' })
  }

  function closeAllDropdowns() {
    setShowSettingsMenu(false)
    setShowTeamSelector(false)
    setShowCoachDropdown(false)
    setShowMoreMenu(false)
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

  // Primary tabs shown directly in navbar
  const primaryModes: { key: NavMode; label: string; icon?: boolean }[] = [
    { key: 'home', label: t('dashboardTab'), icon: true },
    { key: 'vibe', label: t('teamsDetailVibe') },
    { key: 'wow', label: t('teamsDetailWow') },
    { key: 'feedback', label: t('feedbackTitle') },
  ]

  // Secondary tabs shown in "More" dropdown
  const secondaryModes: { key: NavMode; label: string }[] = [
    { key: 'coach', label: t('coachQuestionsTab') },
    { key: 'settings', label: t('teamsDetailSettings') },
  ]

  // Items for the "More" dropdown that are not team modes
  const moreMenuExtras = [
    { href: '/backlog', label: t('backlogTab') },
  ]

  // All modes for mobile menu
  const navModes = [...primaryModes, ...secondaryModes]

  const isSecondaryActive = secondaryModes.some(m => m.key === activeMode)

  return (
    <>
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700 sticky top-0 z-40" role="banner">
        <nav className="max-w-6xl mx-auto px-4" aria-label="Main navigation">
          <div className="flex items-center h-14 gap-1">
            {/* Brand */}
            <Link
              href="/teams"
              className="shrink-0 flex flex-col leading-none"
              aria-label="Pulse Labs - Home"
            >
              <span className="font-bold text-lg text-stone-900 dark:text-stone-100">Pulse</span>
              <span className="text-[8px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-widest -mt-0.5">Labs</span>
            </Link>

            {/* Team Selector (when on team page) */}
            {isOnTeamPage && currentTeam && (
              <div className="relative ml-3 pl-3 border-l border-stone-200 dark:border-stone-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const next = !showTeamSelector
                    closeAllDropdowns()
                    setShowTeamSelector(next)
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all ${
                    showTeamSelector
                      ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Select team:</span>
                  <span className="font-semibold max-w-35 truncate">{currentTeam.name}</span>
                  <svg className={`w-3 h-3 text-stone-400 dark:text-stone-500 transition-transform ${showTeamSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Team Dropdown */}
                {showTeamSelector && allTeams.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 overflow-hidden z-50">
                    <div className="px-4 py-3 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                          {t('switchTeam')}
                        </span>
                        <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500 tabular-nums">
                          {allTeams.length}
                        </span>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1.5">
                      {allTeams.map((team) => (
                        <button
                          key={team.id}
                          onClick={() => switchTeam(team.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2.5 ${
                            team.id === currentTeam.id
                              ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            team.id === currentTeam.id
                              ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400'
                              : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                          }`}>
                            {team.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-sm font-medium truncate flex-1">{team.name}</span>
                          {team.id === currentTeam.id && (
                            <svg className="w-3.5 h-3.5 text-cyan-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-stone-200 dark:border-stone-700 p-1.5">
                      <Link
                        href="/teams"
                        className="flex items-center justify-between px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700/50 rounded-lg transition-all"
                      >
                        <span>{t('viewAllTeams')}</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Desktop: Team page has no mode tabs — sections unfold inline on the dashboard */}

            {/* Desktop: Global Navigation (when not on team page) */}
            {!isOnTeamPage && (
              <div className="hidden md:flex items-center gap-1 ml-4 border-l border-stone-200 dark:border-stone-700 pl-4">
                {/* Back button on backlog page */}
                {pathname === '/backlog' && (
                  <Link
                    href="/teams"
                    className="flex items-center gap-1 px-2 py-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors mr-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {t('teamsTitle')}
                  </Link>
                )}
                {/* Navigation tabs */}
                <Link
                  href="/teams"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    pathname === '/teams'
                      ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {t('teamsTitle')}
                </Link>
                <Link
                  href="/backlog"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    pathname === '/backlog'
                      ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
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
              {/* Username display */}
              {username && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                    {username}
                  </span>
                  {isPaidTier(subscriptionTier) && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                      Pro
                    </span>
                  )}
                </div>
              )}

              {/* Super Admin Button - only for super admins */}
              {isSuperAdmin && (
                <Link
                  href="/super-admin/dashboard"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg transition-colors"
                >
                  <span>🔐</span>
                  <span>Super Admin</span>
                </Link>
              )}

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const next = !showSettingsMenu
                    closeAllDropdowns()
                    setShowSettingsMenu(next)
                  }}
                  className="p-2.5 min-h-11 min-w-11 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors"
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

                    {/* Billing link */}
                    <div className="border-t border-stone-100 dark:border-stone-700 mt-1 pt-1">
                      <Link
                        href="/account/billing"
                        onClick={() => setShowSettingsMenu(false)}
                        className="block w-full text-left px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                      >
                        {t('accountBilling')}
                      </Link>
                    </div>

                    <div className="border-t border-stone-100 dark:border-stone-700 mt-1 pt-1">
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

      {/* Breadcrumbs removed — team name is in OverallSignal, Pulse logo links to /teams */}

      {/* Mobile tab bar removed — sections unfold inline on the dashboard */}

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

            {/* Team switcher (when on a team page) */}
            {isOnTeamPage && currentTeam && allTeams.length > 0 && (
              <div className="p-2 border-b border-stone-200 dark:border-stone-700">
                <div className="px-3 py-1.5 text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                  {t('switchTeam')}
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {allTeams.map((team) => (
                    <Link
                      key={team.id}
                      href={`/teams/${team.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors touch-manipulation ${
                        team.id === currentTeam.id
                          ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 active:bg-stone-100 dark:active:bg-stone-800'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        team.id === currentTeam.id
                          ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400'
                          : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                      }`}>
                        {team.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">{team.name}</span>
                      {team.id === currentTeam.id && (
                        <svg className="w-4 h-4 text-cyan-500 shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/teams"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 mt-1 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 active:bg-stone-100 dark:active:bg-stone-800 transition-colors touch-manipulation"
                >
                  <span>{t('viewAllTeams')}</span>
                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Navigation Links */}
            <div className="p-2">
              {/* Back button on backlog page */}
              {pathname === '/backlog' && (
                <Link
                  href="/teams"
                  className="flex items-center gap-2 px-3 py-3 mb-2 rounded-lg text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 active:bg-stone-100 dark:active:bg-stone-800 border-b border-stone-100 dark:border-stone-800 touch-manipulation"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {t('teamsTitle')}
                </Link>
              )}
              <Link
                href="/teams"
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation active:bg-stone-200 dark:active:bg-stone-700 ${
                  pathname === '/teams'
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className={`w-5 h-5 ${pathname === '/teams' ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('teamsTitle')}
              </Link>
              <Link
                href="/backlog"
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation active:bg-stone-200 dark:active:bg-stone-700 ${
                  pathname === '/backlog'
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className={`w-5 h-5 ${pathname === '/backlog' ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t('backlogTab')}
              </Link>
              {/* Billing / Subscription */}
              <Link
                href="/account/billing"
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation active:bg-stone-200 dark:active:bg-stone-700 ${
                  pathname === '/account/billing'
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className={`w-5 h-5 ${pathname === '/account/billing' ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {t('accountBilling')}
              </Link>
              {/* Team Reminders (coming soon) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowRemindersInfo(true)
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 active:bg-stone-100 dark:active:bg-stone-700 transition-colors touch-manipulation"
              >
                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {t('teamRemindersSoon')}
              </button>
            </div>

            {/* Settings */}
            <div className="p-2 border-t border-stone-200 dark:border-stone-700">
              {/* Language Toggle */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm text-stone-600 dark:text-stone-400">{t('language')}</span>
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLanguage('nl')
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors touch-manipulation ${
                      language === 'nl'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    NL
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLanguage('en')
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors touch-manipulation ${
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
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTheme('light')
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors touch-manipulation ${
                      mounted && theme === 'light'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTheme('dark')
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors touch-manipulation ${
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
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleLogout()
                }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/40 transition-colors touch-manipulation"
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

      {/* Team Reminders Info Modal */}
      {showRemindersInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRemindersInfo(false)}>
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{t('teamRemindersTitle')}</h3>
              </div>
            </div>
            <div className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line mb-4">
              {t('teamRemindersBody')}
            </div>
            <p className="text-xs text-stone-400 dark:text-stone-500 italic">
              {t('teamRemindersNotAvailable')}
            </p>
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
