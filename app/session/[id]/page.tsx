import { notFound } from 'next/navigation'
import { getSession, synthesizeSession, getSessionShareLink } from '@/domain/ceremonies/actions'
import { SessionDetailContent } from '@/components/ceremonies/session-detail-content'

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

  return (
    <SessionDetailContent
      session={session}
      synthesis={synthesis}
      shareLink={shareLink}
      backPath={`/teams/${session.team_id}?tab=ceremonies`}
    />
  )
}
