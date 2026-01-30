'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { Button } from '@/components/ui/button'

export function AdminHeader() {
  const t = useTranslation()
  const router = useRouter()
  const pathname = usePathname()

  const isTeams = pathname?.startsWith('/teams')
  const isPulse = pathname?.startsWith('/pulse')
  const isDelta = pathname?.startsWith('/delta')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-stone-200" role="banner">
      <nav className="max-w-4xl mx-auto px-4" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2" aria-label="The Lab - Home">
              <span className="text-2xl" aria-hidden="true">🧪</span>
              <span className="font-bold text-lg text-stone-900">The Lab</span>
            </Link>

            {/* Tool navigation */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                href="/teams"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isTeams
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                Teams
              </Link>
              <Link
                href="/pulse/admin/teams"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isPulse
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                💗 Pulse
              </Link>
              <Link
                href="/delta/teams"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isDelta
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                Δ Delta
              </Link>
              <Link
                href="/backlog"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                Backlog
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Log out">
              {t('adminLogout')}
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="sm:hidden flex items-center gap-1 pb-3 -mt-1 overflow-x-auto">
          <Link
            href="/teams"
            className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isTeams
                ? 'bg-cyan-50 text-cyan-700'
                : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            Teams
          </Link>
          <Link
            href="/pulse/admin/teams"
            className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isPulse
                ? 'bg-cyan-50 text-cyan-700'
                : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            Pulse
          </Link>
          <Link
            href="/delta/teams"
            className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isDelta
                ? 'bg-cyan-50 text-cyan-700'
                : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            Delta
          </Link>
          <Link
            href="/backlog"
            className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors whitespace-nowrap"
          >
            Backlog
          </Link>
        </div>
      </nav>
    </header>
  )
}
