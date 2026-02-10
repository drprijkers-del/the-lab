import { notFound } from 'next/navigation'
import { getSession, synthesizeSession, getSessionShareLink } from '@/domain/wow/actions'
import { SessionDetailContent } from '@/components/wow/session-detail-content'
import { createAdminClient } from '@/lib/supabase/server'

interface SessionDetailPageProps {
  params: Promise<{ sessionId: string }>
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { sessionId } = await params

  const [session, synthesis, shareLink] = await Promise.all([
    getSession(sessionId),
    synthesizeSession(sessionId),
    getSessionShareLink(sessionId),
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
      teamSize={team?.expected_team_size ?? null}
    />
  )
}
