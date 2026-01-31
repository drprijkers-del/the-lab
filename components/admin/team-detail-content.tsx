'use client'

import Link from 'next/link'
import { TeamWithStats } from '@/domain/teams/actions'
import type { TeamMetrics, PulseInsight } from '@/domain/metrics/types'
import { AdminHeader } from '@/components/admin/header'
import { TeamActions } from '@/components/admin/team-actions'
import { ShareLinkSection } from '@/components/admin/share-link-section'
import { TeamStats } from '@/components/admin/team-stats'
import { TeamSettings } from '@/components/admin/team-settings'
import { PulseMetrics } from '@/components/admin/pulse-metrics'
import { Fly, FlyFrequency } from '@/components/ui/fly'
import { useTranslation, useLanguage } from '@/lib/i18n/context'

interface TeamDetailContentProps {
  team: TeamWithStats
  metrics: TeamMetrics | null
  insights: PulseInsight[]
  flyFrequency: FlyFrequency
}

export function TeamDetailContent({ team, metrics, insights, flyFrequency }: TeamDetailContentProps) {
  const t = useTranslation()
  const { language } = useLanguage()

  const dateLocale = language === 'nl' ? 'nl-NL' : 'en-US'

  return (
    <div className="relative overflow-hidden">
      {/* The Fly - responds to team pulse state */}
      <Fly frequency={flyFrequency} />

      <AdminHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/pulse/admin/teams"
          className="inline-flex items-center text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 mb-6 min-h-11 py-2"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('adminBack')}
        </Link>

        {/* Team header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{team.name}</h1>
              {team.description && (
                <p className="text-stone-500 dark:text-stone-400 mt-1">{team.description}</p>
              )}
              <p className="text-sm text-stone-400 dark:text-stone-500 mt-2">
                {t('adminCreatedOn')} {new Date(team.created_at).toLocaleDateString(dateLocale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <TeamActions team={team} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column: Metrics */}
          <div className="space-y-6">
            {metrics && (
              <PulseMetrics metrics={metrics} insights={insights} />
            )}
          </div>

          {/* Right column: Actions & Stats */}
          <div className="space-y-6">
            {/* Share link */}
            <ShareLinkSection teamId={team.id} teamSlug={team.slug} />

            {/* Basic stats */}
            <TeamStats team={team} />

            {/* Team settings */}
            <TeamSettings team={team} />
          </div>
        </div>
      </main>
    </div>
  )
}
