'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'

interface LegalPageContentProps {
  page: 'terms' | 'privacy' | 'cookies'
}

export function LegalPageContent({ page }: LegalPageContentProps) {
  const t = useTranslation()

  const config = {
    terms: {
      title: t('legalTermsTitle'),
      sections: [
        { heading: t('legalTermsS1Title'), body: t('legalTermsS1Body') },
        { heading: t('legalTermsS2Title'), body: t('legalTermsS2Body') },
        { heading: t('legalTermsS3Title'), body: t('legalTermsS3Body') },
        { heading: t('legalTermsS4Title'), body: t('legalTermsS4Body') },
        { heading: t('legalTermsS5Title'), body: t('legalTermsS5Body') },
        { heading: t('legalTermsS6Title'), body: t('legalTermsS6Body') },
        { heading: t('legalTermsS7Title'), body: t('legalTermsS7Body') },
      ],
    },
    privacy: {
      title: t('legalPrivacyTitle'),
      sections: [
        { heading: t('legalPrivacyS1Title'), body: t('legalPrivacyS1Body') },
        { heading: t('legalPrivacyS2Title'), body: t('legalPrivacyS2Body') },
        { heading: t('legalPrivacyS3Title'), body: t('legalPrivacyS3Body') },
        { heading: t('legalPrivacyS4Title'), body: t('legalPrivacyS4Body') },
        { heading: t('legalPrivacyS5Title'), body: t('legalPrivacyS5Body') },
      ],
    },
    cookies: {
      title: t('legalCookiesTitle'),
      sections: [
        { heading: t('legalCookiesS1Title'), body: t('legalCookiesS1Body') },
        { heading: t('legalCookiesS2Title'), body: t('legalCookiesS2Body') },
        { heading: t('legalCookiesS3Title'), body: t('legalCookiesS3Body') },
      ],
    },
  }

  const { title, sections } = config[page]

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 mb-8"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Pulse Labs
        </Link>

        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">{title}</h1>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-10">{t('legalLastUpdated')}: februari 2026</p>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-2">{section.heading}</h2>
              <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line">
                {section.body}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-stone-200 dark:border-stone-700">
          <p className="text-xs text-stone-400 dark:text-stone-500">
            {t('legalContact')}:{' '}
            <a href="mailto:info@pulse-labs.io" className="underline hover:text-stone-600 dark:hover:text-stone-300">
              info@pulse-labs.io
            </a>
          </p>
          <div className="flex gap-4 mt-3 text-xs">
            {page !== 'terms' && <Link href="/terms" className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">{t('footerTerms')}</Link>}
            {page !== 'privacy' && <Link href="/privacy" className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">{t('footerPrivacy')}</Link>}
            {page !== 'cookies' && <Link href="/cookies" className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">{t('footerCookies')}</Link>}
          </div>
        </div>
      </div>
    </div>
  )
}
