'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { LoginForm } from '@/components/admin/login-form'

export function LoginPageContent() {
  const t = useTranslation()

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="leading-none">
            <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">Pulse</span>
            <span className="block text-[10px] font-medium text-stone-400 dark:text-stone-500 tracking-widest uppercase">labs</span>
          </div>
        </Link>
        <LanguageToggle />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4 -mt-16">
        <div className="w-full max-w-sm">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <span className="text-4xl font-bold text-stone-900 dark:text-stone-100">Pulse</span>
              <span className="block text-sm font-medium text-stone-400 dark:text-stone-500 tracking-[0.3em] uppercase">labs</span>
            </div>
            <p className="text-sm text-stone-400 dark:text-stone-500">{t('loginAdminAccess')}</p>
          </div>

          <Suspense fallback={
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-1/2 mx-auto"></div>
                <div className="h-12 bg-stone-200 dark:bg-stone-700 rounded"></div>
                <div className="h-12 bg-stone-200 dark:bg-stone-700 rounded"></div>
              </div>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
