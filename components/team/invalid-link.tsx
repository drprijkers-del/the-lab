'use client'

import { useTranslation } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/ui/language-toggle'

interface InvalidLinkProps {
  message?: string
}

export function InvalidLink({ message }: InvalidLinkProps) {
  const t = useTranslation()

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚗️</span>
            <span className="text-sm text-stone-400 dark:text-stone-500">{t('pulse')}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <span className="tool-badge">{t('pulse')}</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">🔗</div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3">
            {t('invalidTitle')}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mb-8">
            {message || t('invalidMessage')}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-sm">
            <span>💡</span>
            <span>{t('invalidTip')}</span>
          </div>
        </div>
      </main>
    </div>
  )
}
