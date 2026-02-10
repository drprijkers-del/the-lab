import { validateSessionCode } from '@/domain/wow/actions'
import { ParticipationContent } from '@/components/wow/participation-content'
import { InvalidSession } from '@/components/wow/invalid-session'

interface ParticipationPageProps {
  params: Promise<{ sessionCode: string }>
}

export default async function ParticipationPage({ params }: ParticipationPageProps) {
  const { sessionCode } = await params

  const validation = await validateSessionCode(sessionCode)

  if (!validation.valid || !validation.session) {
    return <InvalidSession />
  }

  return (
    <ParticipationContent
      sessionId={validation.session.id}
      teamName={validation.session.team_name}
      angle={validation.session.angle}
      title={validation.session.title}
      wowLevel={validation.session.wow_level}
      teamSize={validation.session.team_size}
    />
  )
}
