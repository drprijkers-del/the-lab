import Link from 'next/link'
import { getTeams } from '@/domain/teams/actions'
import { requireAdmin } from '@/lib/auth/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminHeader } from '@/components/admin/header'
import { TeamCard } from '@/components/admin/team-card'

export default async function TeamsPage() {
  await requireAdmin()
  const teams = await getTeams()

  return (
    <div>
      <AdminHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
            <p className="text-gray-500">Beheer je team mood check-ins</p>
          </div>
          <Link href="/admin/teams/new">
            <Button className="w-full sm:w-auto">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nieuw team
            </Button>
          </Link>
        </div>

        {/* Teams grid */}
        {teams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen teams</h3>
              <p className="text-gray-500 mb-6">Maak je eerste team aan om te beginnen met mood tracking.</p>
              <Link href="/admin/teams/new">
                <Button>Eerste team aanmaken</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
