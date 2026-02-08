'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n/context'

export function InvalidSession() {
  const t = useTranslation()

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
            <svg className="w-6 h-6 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">{t('sessionNotFound')}</h1>
          <p className="text-stone-500 dark:text-stone-400 mb-6">
            {t('sessionNotFoundMessage')}
          </p>
          <Link
            href="/"
            className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300"
          >
            {t('goToHome')}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
