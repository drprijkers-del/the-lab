'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTeam } from '@/domain/teams/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AdminHeader } from '@/components/admin/header'
import { useTranslation } from '@/lib/i18n/context'

export default function NewTeamPage() {
  const t = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createTeam(formData)

    if (!result.success) {
      setError(result.error || t('error'))
      setLoading(false)
      return
    }

    router.push(`/admin/teams/${result.teamId}`)
  }

  return (
    <div>
      <AdminHeader />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/admin/teams"
          className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('adminBack')}
        </Link>

        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold">{t('newTeamTitle')}</h1>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="name"
                name="name"
                label={t('newTeamName')}
                placeholder={t('newTeamNamePlaceholder')}
                required
                minLength={2}
              />

              <div className="space-y-1">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  {t('newTeamDescription')}
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder={t('newTeamDescriptionPlaceholder')}
                  className="block w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <Input
                id="expected_team_size"
                name="expected_team_size"
                type="number"
                label={t('newTeamSize')}
                placeholder={t('newTeamSizePlaceholder')}
                min={1}
                max={100}
              />

              <div className="flex gap-3 pt-4">
                <Link href="/admin/teams" className="flex-1">
                  <Button type="button" variant="secondary" className="w-full">
                    {t('cancel')}
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" loading={loading}>
                  {t('newTeamCreate')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
