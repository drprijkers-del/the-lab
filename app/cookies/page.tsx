import type { Metadata } from 'next'
import { LegalPageContent } from '@/components/legal/legal-page-content'

export const metadata: Metadata = {
  title: 'Cookiebeleid',
  description: 'Cookiebeleid van Pulse Labs — welke cookies we gebruiken en waarom.',
  alternates: { canonical: '/cookies' },
}

export default function CookiesPage() {
  return <LegalPageContent page="cookies" />
}
