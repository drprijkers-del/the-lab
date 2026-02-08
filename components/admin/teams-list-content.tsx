'use client'

import Link from 'next/link'
import { TeamWithStats } from '@/domain/teams/actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminHeader } from '@/components/admin/header'
import { TeamCard } from '@/components/admin/team-card'
import { useTranslation } from '@/lib/i18n/context'

interface TeamsListContentProps {
  teams: TeamWithStats[]
  appType?: 'vibe' | 'wow'
}

export function TeamsListContent({ teams, appType = 'vibe' }: TeamsListContentProps) {
  const t = useTranslation()

  const newTeamHref = appType === 'wow'
    ? '/teams/new'
    : '/vibe/admin/teams/new'

  const title = appType === 'wow' ? 'Delta Teams' : t('adminTeams')
  const subtitle = appType === 'wow' ? 'Team coaching interventies' : t('adminTeamsSubtitle')

  return (
    <div>
      <AdminHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-500">{subtitle}</p>
          </div>
          <Link href={newTeamHref}>
            <Button className="w-full sm:w-auto">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('adminNewTeam')}
            </Button>
          </Link>
        </div>

        {/* Teams grid */}
        {teams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">{appType === 'wow' ? 'Δ' : '🎯'}</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('adminNoTeams')}</h3>
              <p className="text-gray-500 mb-6">{t('adminNoTeamsMessage')}</p>
              <Link href={newTeamHref}>
                <Button>{t('adminFirstTeam')}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} appType={appType} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
