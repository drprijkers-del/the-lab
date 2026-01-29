import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTeam } from '@/domain/teams/actions'
import { requireAdmin } from '@/lib/auth/admin'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AdminHeader } from '@/components/admin/header'
import { TeamActions } from '@/components/admin/team-actions'
import { ShareLinkSection } from '@/components/admin/share-link-section'
import { TeamStats } from '@/components/admin/team-stats'

interface TeamDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  await requireAdmin()
  const { id } = await params
  const team = await getTeam(id)

  if (!team) {
    notFound()
  }

  return (
    <div>
      <AdminHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/admin/teams"
          className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Terug naar teams
        </Link>

        {/* Team header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              {team.description && (
                <p className="text-gray-500 mt-1">{team.description}</p>
              )}
              <p className="text-sm text-gray-400 mt-2">
                Aangemaakt op {new Date(team.created_at).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <TeamActions team={team} />
          </div>
        </div>

        <div className="grid gap-6">
          {/* Share link */}
          <ShareLinkSection teamId={team.id} teamSlug={team.slug} />

          {/* Stats */}
          <TeamStats team={team} />
        </div>
      </main>
    </div>
  )
}
