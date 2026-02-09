'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTeam } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'

export function NewTeamForm() {
  const t = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitInfo, setLimitInfo] = useState<{ teamCount: number; maxTeams: number } | null>(null)

  async function handleSubmit(formData: FormData) {
    if (loading) return
    setLoading(true)
    setError(null)
    setLimitInfo(null)

    const result = await createTeam(formData)

    if (!result.success) {
      setError(result.error || 'Failed to create team')
      if (result.error === 'teamLimitReached' && 'teamCount' in result && 'maxTeams' in result) {
        setLimitInfo({ teamCount: result.teamCount as number, maxTeams: result.maxTeams as number })
      }
      setLoading(false)
      return
    }

    router.push(`/teams/${result.teamId}`)
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm">
          {error === 'teamLimitReached' ? (
            <div className="space-y-2">
              <p className="text-red-600 dark:text-red-400">{t('teamLimitReached')}</p>
              {limitInfo && (
                <p className="text-xs text-red-500/80 dark:text-red-400/80">
                  {limitInfo.teamCount} / {limitInfo.maxTeams} {t('tierTeamUsage').toLowerCase()}
                </p>
              )}
              <Link
                href="/account/billing?returnUrl=/teams/new"
                className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
              >
                {t('teamLimitUpgradeLink')} &rarr;
              </Link>
            </div>
          ) : (
            <p className="text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          {t('newTeamName')} *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          minLength={2}
          placeholder={t('newTeamNamePlaceholder')}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          {t('newTeamDescription')}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder={t('newTeamDescriptionPlaceholder')}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors resize-none"
        />
      </div>

      <div>
        <label htmlFor="expected_team_size" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          {t('newTeamSize')}
        </label>
        <input
          type="number"
          id="expected_team_size"
          name="expected_team_size"
          min={1}
          max={100}
          placeholder={t('newTeamSizePlaceholder')}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
        />
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{t('newTeamSizeHelp')}</p>
      </div>

      {/* Info box about tools */}
      <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-cyan-500 dark:text-cyan-400 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-stone-600 dark:text-stone-400">
            <p className="font-medium text-stone-700 dark:text-stone-300 mb-1">{t('teamsToolsEnabled')}</p>
            <p>Vibe en Way of Work worden automatisch geactiveerd voor dit team. Je kunt dit later aanpassen in de team instellingen.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/teams" className="flex-1">
          <Button type="button" variant="secondary" className="w-full">
            {t('cancel')}
          </Button>
        </Link>
        <Button type="submit" loading={loading} className="flex-1">
          {t('create')}
        </Button>
      </div>
    </form>
  )
}
