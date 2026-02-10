import { notFound } from 'next/navigation'
import { getSession, synthesizeSession, getSessionShareLink } from '@/domain/wow/actions'
import { SessionDetailContent } from '@/components/wow/session-detail-content'
import { createAdminClient } from '@/lib/supabase/server'

interface SessionPageProps {
  params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params

  const [session, synthesis, shareLink] = await Promise.all([
    getSession(id),
    synthesizeSession(id),
    getSessionShareLink(id),
  ])

  if (!session) {
    notFound()
  }

  // Get team size for statement count consistency
  const supabase = await createAdminClient()
  const { data: team } = await supabase
    .from('teams')
    .select('expected_team_size')
    .eq('id', session.team_id)
    .single()

  return (
    <SessionDetailContent
      session={session}
      synthesis={synthesis}
      shareLink={shareLink}
      backPath={`/teams/${session.team_id}?tab=wow`}
      teamSize={team?.expected_team_size ?? null}
    />
  )
}
