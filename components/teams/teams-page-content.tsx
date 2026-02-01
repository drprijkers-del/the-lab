'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UnifiedTeam } from '@/domain/teams/actions'
import { BacklogItem, ReleaseNote } from '@/domain/backlog/actions'
import { TeamsListContent } from '@/components/teams/teams-list-content'
import { BacklogDisplay } from '@/components/backlog/backlog-display'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'

interface TeamsPageContentProps {
  teams: UnifiedTeam[]
  backlogItems: BacklogItem[]
  releases: ReleaseNote[]
}

type MainTab = 'teams' | 'backlog'

export function TeamsPageContent({ teams, backlogItems, releases }: TeamsPageContentProps) {
  const t = useTranslation()
  const [activeTab, setActiveTab] = useState<MainTab>('teams')

  return (
    <div>
      {/* Main tab navigation: Teams | Backlog */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'teams'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Teams
            {teams.length > 0 && (
              <span className="ml-1.5 text-xs text-stone-400 dark:text-stone-500">({teams.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('backlog')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'backlog'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Backlog
          </button>
        </div>

        {/* New Team button - only on Teams tab */}
        {activeTab === 'teams' && (
          <Link href="/teams/new" className="shrink-0">
            <Button className="w-full sm:w-auto">{t('teamsNewTeam')}</Button>
          </Link>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'teams' && (
        <TeamsListContent teams={teams} />
      )}

      {activeTab === 'backlog' && (
        <div>
          <p className="text-stone-500 dark:text-stone-400 mb-6">
            What we&apos;re exploring, building, and have decided against.
          </p>
          <BacklogDisplay items={backlogItems} releases={releases} />
        </div>
      )}
    </div>
  )
}
