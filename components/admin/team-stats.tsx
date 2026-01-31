'use client'

import { TeamWithStats } from '@/domain/teams/actions'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getMoodEmoji } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/context'

interface TeamStatsProps {
  team: TeamWithStats
}

export function TeamStats({ team }: TeamStatsProps) {
  const t = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="py-6 text-center">
          <div className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">{team.participantCount}</div>
          <div className="text-sm text-stone-500 dark:text-stone-400 mt-1">{t('statsParticipants')}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6 text-center">
          <div className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">{team.todayEntries}</div>
          <div className="text-sm text-stone-500 dark:text-stone-400 mt-1">{t('statsCheckinsToday')}</div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">{t('statsMoodScale')}</h3>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4, 5].map((mood) => (
              <div key={mood} className="text-center">
                <div className="text-3xl mb-1">{getMoodEmoji(mood)}</div>
                <div className="text-xs text-stone-400 dark:text-stone-500">{mood}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
