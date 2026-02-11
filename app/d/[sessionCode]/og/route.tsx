import { ImageResponse } from 'next/og'
import { validateSessionCode } from '@/domain/wow/actions'

const ANGLE_LABELS: Record<string, string> = {
  scrum: 'Scrum', flow: 'Flow', ownership: 'Ownership', collaboration: 'Collaboration',
  technical_excellence: 'Technical Excellence', refinement: 'Refinement', planning: 'Planning',
  retro: 'Retro', demo: 'Demo', obeya: 'Obeya', dependencies: 'Dependencies',
  psychological_safety: 'Psych Safety', devops: 'DevOps', stakeholder: 'Stakeholders', leadership: 'Leadership',
}

const LEVEL_INFO: Record<string, { kanji: string; label: string }> = {
  shu: { kanji: '守', label: 'Shu' },
  ha: { kanji: '破', label: 'Ha' },
  ri: { kanji: '離', label: 'Ri' },
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionCode: string }> }
) {
  const { sessionCode } = await params
  const validation = await validateSessionCode(sessionCode)

  if (!validation.valid || !validation.session) {
    return new Response('Not found', { status: 404 })
  }

  const { team_name, angle, title, wow_level } = validation.session
  const angleLabel = ANGLE_LABELS[angle] || angle
  const levelInfo = LEVEL_INFO[wow_level || 'shu']

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #1c1917 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Pulse Labs logo area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #ec4899, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#f5f5f4' }}>Pulse Labs</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>Way of Work</span>
          </div>
        </div>

        {/* Main content card */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: '#292524', borderRadius: '24px', border: '1px solid #44403c',
          padding: '48px 64px', maxWidth: '800px',
        }}>
          {/* Angle + Level */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              padding: '8px 20px', borderRadius: '999px',
              background: '#083344', border: '1px solid #164e63',
              fontSize: '20px', fontWeight: 600, color: '#22d3ee',
            }}>
              {angleLabel}
            </div>
            {levelInfo && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '999px',
                background: '#451a03', border: '1px solid #78350f',
              }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24' }}>{levelInfo.kanji}</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#fbbf24' }}>{levelInfo.label}</span>
              </div>
            )}
          </div>

          {/* Team name */}
          <h1 style={{ fontSize: '40px', fontWeight: 700, color: '#f5f5f4', margin: '0 0 8px', textAlign: 'center' as const }}>
            {team_name}
          </h1>

          {/* Title or CTA */}
          <p style={{ fontSize: '20px', color: '#a8a29e', margin: 0, textAlign: 'center' as const }}>
            {title || 'Deel jouw perspectief op de werkwijze van het team'}
          </p>
        </div>

        {/* Bottom CTA */}
        <div style={{
          marginTop: '32px', padding: '12px 32px', borderRadius: '12px',
          background: '#06b6d4', fontSize: '18px', fontWeight: 600, color: 'white',
        }}>
          Doe mee via pulse-labs.io
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
