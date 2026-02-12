import type { Metadata } from 'next'
import { LegalPageContent } from '@/components/legal/legal-page-content'

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden',
  description: 'Algemene voorwaarden van Pulse Labs — lees onze gebruiksvoorwaarden voor het platform.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return <LegalPageContent page="terms" />
}
