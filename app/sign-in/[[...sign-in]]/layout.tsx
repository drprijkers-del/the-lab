import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in bij Pulse Labs — team health tools voor agile coaches en scrum masters.',
  alternates: { canonical: '/sign-in' },
  robots: { index: false },
}

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children
}
