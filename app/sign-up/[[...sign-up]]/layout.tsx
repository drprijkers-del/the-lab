import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account aanmaken',
  description: 'Maak een gratis Pulse Labs account — begin met Vibe Check, Way of Work, Team Feedback en AI Coach Preparation.',
  alternates: { canonical: '/sign-up' },
}

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children
}
