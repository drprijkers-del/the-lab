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
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🧪</span>
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Pulse</span>
        </Link>
        <LanguageToggle />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4 -mt-16">
        <div className="w-full max-w-sm">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🧪</div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">Pulse</h1>
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

          <p className="text-center text-stone-400 dark:text-stone-500 text-xs mt-6">
            {t('loginForgotPassword')}
          </p>
        </div>
      </main>
    </div>
  )
}
