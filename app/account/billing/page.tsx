import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth/admin'
import { getAccountBillingInfo } from '@/domain/billing/actions'
import { BillingPageContent } from '@/components/account/billing-page-content'
import Link from 'next/link'

export default async function AccountBillingPage() {
  await requireAdmin()
  const billingInfo = await getAccountBillingInfo()

  return (
    <>
      {/* Minimal standalone header — no team context */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700 sticky top-0 z-40">
        <nav className="max-w-5xl mx-auto px-4">
          <div className="flex items-center h-14 gap-3">
            <Link href="/teams" className="shrink-0 flex flex-col leading-none" aria-label="Pulse Labs - Home">
              <span className="font-bold text-lg text-stone-900 dark:text-stone-100">Pulse</span>
              <span className="text-[8px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-widest -mt-0.5">Labs</span>
            </Link>
            <span className="text-stone-300 dark:text-stone-600">/</span>
            <span className="text-sm font-medium text-stone-600 dark:text-stone-300">Subscription</span>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8 pb-24">
        <Suspense fallback={
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-48 bg-stone-200 dark:bg-stone-700 rounded" />
            <div className="h-4 w-72 bg-stone-200 dark:bg-stone-700 rounded" />
          </div>
        }>
          <BillingPageContent billingInfo={billingInfo} />
        </Suspense>
      </main>
    </>
  )
}
