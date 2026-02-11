'use client'

import { useState } from 'react'
import { UnifiedTeam } from '@/domain/teams/actions'
import { type TeamOwner } from '@/app/teams/page'
import { TeamsListContent } from '@/components/teams/teams-list-content'
import { useTranslation } from '@/lib/i18n/context'

interface TeamsPageContentProps {
  teams: UnifiedTeam[]
  owners?: TeamOwner[]
  userRole?: 'super_admin' | 'scrum_master'
  currentUserId?: string
}

export function TeamsPageContent({ teams, owners = [], userRole, currentUserId }: TeamsPageContentProps) {
  const t = useTranslation()

  const [showShuHaRi, setShowShuHaRi] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('teams_shuhari_visible')
    return stored === null ? true : stored === 'true'
  })

  const toggleShuHaRi = () => {
    setShowShuHaRi(prev => {
      const next = !prev
      localStorage.setItem('teams_shuhari_visible', String(next))
      return next
    })
  }

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
          {t('teamsTitle')}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          {t('teamsIntro').split(/(\{levelIcon\}|\{vibeIcon\}|\{wowIcon\})/).map((segment, i) => {
            if (segment === '{levelIcon}') return <span key={i}><span className="font-bold text-amber-500">守</span><span className="font-bold text-cyan-500">破</span><span className="font-bold text-purple-500">離</span></span>
            if (segment === '{vibeIcon}') return <svg key={i} className="w-3.5 h-3.5 inline-block -mt-px text-pink-500" viewBox="0 0 24 24" fill="none"><path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
            if (segment === '{wowIcon}') return <span key={i} className="font-bold text-cyan-500">Δ</span>
            return segment
          })}
        </p>
      </div>

      {/* Shu-Ha-Ri learning path — collapsible */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
            {t('shuHaRiTitle')}
          </h2>
          <button
            onClick={toggleShuHaRi}
            className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
          >
            <svg
              className={`w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-transform ${
                showShuHaRi ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="accordion-content" data-open={showShuHaRi}>
          <div className="space-y-3">
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              {t('shuHaRiIntro')}
            </p>

            <blockquote className="border-l-2 border-stone-300 dark:border-stone-600 pl-5 py-3 my-4">
              <p className="text-xs text-stone-400 dark:text-stone-500 italic leading-relaxed">
                {t('teamsQuote')}
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
                {t('teamsQuoteAuthor')}
              </p>
            </blockquote>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Shu */}
              <div className="relative isolate rounded-xl overflow-hidden bg-amber-300 dark:bg-amber-600">
                <div
                  className="absolute inset-0 bg-white dark:bg-stone-800"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 6%, rgba(0,0,0,0.2) 10%, rgba(0,0,0,0.45) 15%, rgba(0,0,0,0.7) 18%, rgba(0,0,0,0.9) 21%, rgba(0,0,0,1) 25%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 6%, rgba(0,0,0,0.2) 10%, rgba(0,0,0,0.45) 15%, rgba(0,0,0,0.7) 18%, rgba(0,0,0,0.9) 21%, rgba(0,0,0,1) 25%)',
                  }}
                />
                <span className="absolute -left-3 -top-4 text-white/30 select-none pointer-events-none" style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1 }}>守</span>
                <div className="relative z-10 p-3 sm:p-4 pl-[20%]">
                  <div className="text-base font-extrabold text-stone-900 dark:text-stone-100">{t('shuHaRiShuLabel')}</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 mt-1 leading-relaxed">{t('shuHaRiShuDesc')}</div>
                </div>
              </div>

              {/* Ha */}
              <div className="relative isolate rounded-xl overflow-hidden bg-cyan-300 dark:bg-cyan-600">
                <div
                  className="absolute inset-0 bg-white dark:bg-stone-800"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 6%, rgba(0,0,0,0.2) 10%, rgba(0,0,0,0.45) 15%, rgba(0,0,0,0.7) 18%, rgba(0,0,0,0.9) 21%, rgba(0,0,0,1) 25%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 6%, rgba(0,0,0,0.2) 10%, rgba(0,0,0,0.45) 15%, rgba(0,0,0,0.7) 18%, rgba(0,0,0,0.9) 21%, rgba(0,0,0,1) 25%)',
                  }}
                />
                <span className="absolute -left-3 -top-4 text-white/30 select-none pointer-events-none" style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1 }}>破</span>
                <div className="relative z-10 p-3 sm:p-4 pl-[20%]">
                  <div className="text-base font-extrabold text-stone-900 dark:text-stone-100">{t('shuHaRiHaLabel')}</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 mt-1 leading-relaxed">{t('shuHaRiHaDesc')}</div>
                </div>
              </div>

              {/* Ri */}
              <div className="relative isolate rounded-xl overflow-hidden bg-purple-300 dark:bg-purple-600">
                <div
                  className="absolute inset-0 bg-white dark:bg-stone-800"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 6%, rgba(0,0,0,0.2) 10%, rgba(0,0,0,0.45) 15%, rgba(0,0,0,0.7) 18%, rgba(0,0,0,0.9) 21%, rgba(0,0,0,1) 25%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 6%, rgba(0,0,0,0.2) 10%, rgba(0,0,0,0.45) 15%, rgba(0,0,0,0.7) 18%, rgba(0,0,0,0.9) 21%, rgba(0,0,0,1) 25%)',
                  }}
                />
                <span className="absolute -left-3 -top-4 text-white/30 select-none pointer-events-none" style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1 }}>離</span>
                <div className="relative z-10 p-3 sm:p-4 pl-[20%]">
                  <div className="text-base font-extrabold text-stone-900 dark:text-stone-100">{t('shuHaRiRiLabel')}</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 mt-1 leading-relaxed">{t('shuHaRiRiDesc')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teams list */}
      <TeamsListContent teams={teams} owners={owners} userRole={userRole} currentUserId={currentUserId} />
    </div>
  )
}
