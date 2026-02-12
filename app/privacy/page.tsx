import type { Metadata } from 'next'
import { LegalPageContent } from '@/components/legal/legal-page-content'

export const metadata: Metadata = {
  title: 'Privacybeleid',
  description: 'Privacybeleid van Pulse Labs — hoe wij omgaan met je gegevens en je privacy beschermen.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return <LegalPageContent page="privacy" />
}
