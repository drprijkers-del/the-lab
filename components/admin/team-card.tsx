'use client'

import Link from 'next/link'
import { TeamWithStats } from '@/domain/teams/actions'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n/context'

interface TeamCardProps {
  team: TeamWithStats
}

export function TeamCard({ team }: TeamCardProps) {
  const t = useTranslation()

  return (
    <Link href={`/admin/teams/${team.id}`} aria-label={`View team ${team.name}`}>
      <Card className="card-hover cursor-pointer">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Team avatar */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0">
              {team.name.charAt(0).toUpperCase()}
            </div>

            {/* Team info - grows to fill space */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-900 truncate">{team.name}</h3>
                {team.activeLink && (
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline">
                    {t('adminActive')}
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-500">
                {team.participantCount} {t('adminParticipants')} • {team.todayEntries} {t('adminToday')}
              </p>
            </div>

            {/* Arrow */}
            <svg className="w-5 h-5 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
