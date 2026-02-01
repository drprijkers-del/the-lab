'use client'

import { useTranslation } from '@/lib/i18n/context'
import { BacklogDisplay } from '@/components/backlog/backlog-display'
import type { BacklogItem, ReleaseNote } from '@/domain/backlog/actions'

interface BacklogPageContentProps {
  items: BacklogItem[]
  releases: ReleaseNote[]
}

export function BacklogPageContent({ items, releases }: BacklogPageContentProps) {
  const t = useTranslation()

  return (
    <div className="space-y-6">
      {/* Page header with context */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
          {t('backlogTab')}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-2xl">
          What we&apos;re exploring, building, and have decided against.
        </p>
      </div>

      {/* Backlog content */}
      <BacklogDisplay items={items} releases={releases} />
    </div>
  )
}
