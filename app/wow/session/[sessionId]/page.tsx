import { notFound } from 'next/navigation'
import { getSession, synthesizeSession, getSessionShareLink } from '@/domain/wow/actions'
import { SessionDetailContent } from '@/components/wow/session-detail-content'

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

  return (
    <SessionDetailContent
      session={session}
      synthesis={synthesis}
      shareLink={shareLink}
    />
  )
}
