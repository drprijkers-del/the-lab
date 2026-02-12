import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Pulse Labs — Team Health Tools'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #1c1917 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo circle */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            P
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            color: '#f5f5f4',
            fontSize: 56,
            fontWeight: 700,
            marginBottom: 16,
            letterSpacing: '-0.02em',
          }}
        >
          Pulse Labs
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: '#a8a29e',
            fontSize: 28,
            fontWeight: 400,
            marginBottom: 48,
          }}
        >
          Team Health Tools for Agile Coaches & Scrum Masters
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          {['Vibe Check', 'Way of Work', 'Team Feedback', 'AI Coach'].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  background: 'rgba(225, 29, 72, 0.15)',
                  border: '1px solid rgba(225, 29, 72, 0.3)',
                  borderRadius: 9999,
                  padding: '10px 24px',
                  color: '#fb7185',
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            color: '#78716c',
            fontSize: 18,
          }}
        >
          teamlab.app
        </div>
      </div>
    ),
    { ...size }
  )
}
