'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { Button } from '@/components/ui/button'

export function AdminHeader() {
  const t = useTranslation()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-stone-200" role="banner">
      <nav className="max-w-4xl mx-auto px-4" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          <Link href="/admin/teams" className="flex items-center gap-2" aria-label="Pulse Admin - Go to teams">
            <span className="text-2xl" aria-hidden="true">⚗️</span>
            <span className="font-bold text-lg text-stone-900">{t('pulse')}</span>
            <span className="text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full font-medium">
              {t('admin')}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Log out of admin panel">
              {t('adminLogout')}
            </Button>
          </div>
        </div>
      </nav>
    </header>
  )
}
