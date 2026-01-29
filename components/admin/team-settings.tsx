'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TeamWithStats, updateTeam } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n/context'

interface TeamSettingsProps {
  team: TeamWithStats
}

export function TeamSettings({ team }: TeamSettingsProps) {
  const t = useTranslation()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const result = await updateTeam(team.id, formData)

    setLoading(false)

    if (!result.success) {
      setError(result.error || t('error'))
      return
    }

    setSuccess(true)
    router.refresh()
    setTimeout(() => setSuccess(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-stone-900">{t('teamSettings')}</span>
          <svg
            className={`w-5 h-5 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
              {t('teamSettingsSaved')}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              name="name"
              label={t('newTeamName')}
              defaultValue={team.name}
              required
              minLength={2}
            />

            <div className="space-y-1">
              <label htmlFor="description" className="block text-sm font-medium text-stone-700">
                {t('newTeamDescription')}
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={team.description || ''}
                className="block w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <Input
              id="expected_team_size"
              name="expected_team_size"
              type="number"
              label={t('newTeamSize')}
              placeholder={t('newTeamSizePlaceholder')}
              defaultValue={team.expected_team_size || ''}
              min={1}
              max={100}
            />

            <Button type="submit" loading={loading} className="w-full">
              {t('save')}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
