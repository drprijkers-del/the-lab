'use client'

import Link from 'next/link'
import { UnifiedTeam } from '@/domain/teams/actions'
import { TeamsListContent } from '@/components/teams/teams-list-content'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'

interface TeamsPageContentProps {
  teams: UnifiedTeam[]
}

export function TeamsPageContent({ teams }: TeamsPageContentProps) {
  const t = useTranslation()

  return (
    <div className="space-y-6">
      {/* Page header with context */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
          {t('teamsTitle')}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-2xl">
          {t('teamsSubtitle')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        {teams.length > 0 && (
          <span className="text-sm text-stone-500 dark:text-stone-400">
            {teams.length} {teams.length === 1 ? 'team' : 'teams'}
          </span>
        )}
        <div className="flex-1" />
        <Link href="/teams/new" className="shrink-0">
          <Button className="w-full sm:w-auto">{t('teamsNewTeam')}</Button>
        </Link>
      </div>

      {/* Teams list */}
      <TeamsListContent teams={teams} />
    </div>
  )
}
