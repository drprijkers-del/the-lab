'use client'

import { useTranslation } from '@/lib/i18n/context'
import type { TranslationKey } from '@/lib/i18n/translations'
import { Button } from '@/components/ui/button'
import { useRouter, usePathname } from 'next/navigation'

interface ProGateProps {
  teamId: string
  isPro: boolean
  feature: TranslationKey
  children: React.ReactNode
}

export function ProGate({ teamId, isPro, feature, children }: ProGateProps) {
  const t = useTranslation()
  const router = useRouter()
  const pathname = usePathname()

  if (isPro) return <>{children}</>

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 text-center shadow-lg max-w-sm w-full">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
            {t('proFeature')}
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
            {t(feature)}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">
            {t('billingPriceLabel')}
          </p>
          <Button size="sm" onClick={() => router.push(`/account/billing?returnUrl=${encodeURIComponent(pathname)}`)}>
            {t('upgradeToPro')}
          </Button>
        </div>
      </div>
    </div>
  )
}
