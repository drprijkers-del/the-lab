'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/ui/language-toggle'

type ToolKey = 'vibe' | 'wow' | 'feedback' | 'coach'
type TierKey = 'free' | 'scrum_master' | 'agile_coach' | 'transition_coach' | 'enterprise'
type ComingSoonKey = 'portfolio' | 'transition' | 'whitelabel'

export function HomeContent() {
  const t = useTranslation()
  const [openTool, setOpenTool] = useState<ToolKey | null>('vibe')
  const [openTier, setOpenTier] = useState<TierKey | null>('free')
  const [openComingSoon, setOpenComingSoon] = useState<ComingSoonKey | null>('transition')

  const toggleTool = (tool: ToolKey) => {
    setOpenTool(prev => prev === tool ? null : tool)
  }

  const toggleTier = (tier: TierKey) => {
    setOpenTier(prev => prev === tier ? null : tier)
  }

  const toggleComingSoon = (item: ComingSoonKey) => {
    setOpenComingSoon(prev => prev === item ? null : item)
  }

  const maskStyle = {
    maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,1) 35%)',
    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,1) 35%)',
  }

  const renderToolInfo = (tool: ToolKey) => {
    switch (tool) {
      case 'vibe':
        return (
          <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-pink-400" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-stone-300 leading-relaxed">{t('homeVibeCheckInfo')}</p>
                <Link href="/teams" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-pink-400 hover:text-pink-300 transition-colors">
                  {t('homeTryFree')}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            </div>
          </div>
        )
      case 'wow':
        return (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-cyan-400 font-bold text-sm">Δ</span>
              </div>
              <p className="text-sm text-stone-300 leading-relaxed">{t('homeWowInfo')}</p>
            </div>
            {/* Mini Shu-Ha-Ri preview — responsive */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div className="relative isolate rounded-lg overflow-hidden bg-amber-400/80">
                <div className="absolute inset-0 bg-stone-900/80" style={maskStyle} />
                <span className="absolute -left-1 -top-1.5 sm:-top-2 text-white/20 select-none pointer-events-none" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, lineHeight: 1 }}>守</span>
                <div className="relative z-10 p-1.5 sm:p-2.5 pl-[25%] sm:pl-[30%]">
                  <div className="text-[10px] sm:text-xs font-bold text-stone-100">{t('shuHaRiShuLabel')}</div>
                  <div className="text-[8px] sm:text-[10px] text-stone-400 mt-0.5 leading-snug">{t('shuHaRiShuDesc')}</div>
                </div>
              </div>
              <div className="relative isolate rounded-lg overflow-hidden bg-cyan-400/80">
                <div className="absolute inset-0 bg-stone-900/80" style={maskStyle} />
                <span className="absolute -left-1 -top-1.5 sm:-top-2 text-white/20 select-none pointer-events-none" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, lineHeight: 1 }}>破</span>
                <div className="relative z-10 p-1.5 sm:p-2.5 pl-[25%] sm:pl-[30%]">
                  <div className="text-[10px] sm:text-xs font-bold text-stone-100">{t('shuHaRiHaLabel')}</div>
                  <div className="text-[8px] sm:text-[10px] text-stone-400 mt-0.5 leading-snug">{t('shuHaRiHaDesc')}</div>
                </div>
              </div>
              <div className="relative isolate rounded-lg overflow-hidden bg-purple-400/80">
                <div className="absolute inset-0 bg-stone-900/80" style={maskStyle} />
                <span className="absolute -left-1 -top-1.5 sm:-top-2 text-white/20 select-none pointer-events-none" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, lineHeight: 1 }}>離</span>
                <div className="relative z-10 p-1.5 sm:p-2.5 pl-[25%] sm:pl-[30%]">
                  <div className="text-[10px] sm:text-xs font-bold text-stone-100">{t('shuHaRiRiLabel')}</div>
                  <div className="text-[8px] sm:text-[10px] text-stone-400 mt-0.5 leading-snug">{t('shuHaRiRiDesc')}</div>
                </div>
              </div>
            </div>
            <Link href="/teams" className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
              {t('homeTryFree')}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        )
      case 'feedback':
        return (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-stone-300 leading-relaxed">{t('homeTeamFeedbackInfo')}</p>
                <Link href="/teams" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                  {t('homeTryFree')}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            </div>
          </div>
        )
      case 'coach':
        return (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-stone-300 leading-relaxed">{t('homeCoachQuestionsInfo')}</p>
                <Link href="/teams" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                  {t('homeTryFree')}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            </div>
          </div>
        )
    }
  }

  const renderComingSoonInfo = (item: ComingSoonKey) => {
    switch (item) {
      case 'portfolio':
        return (
          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 sm:p-5">
            <p className="text-sm text-stone-300 leading-relaxed">{t('homePortfolioInfo')}</p>
          </div>
        )
      case 'transition':
        return (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
            <p className="text-sm text-stone-300 leading-relaxed">{t('homeTransitionInfo')}</p>
          </div>
        )
      case 'whitelabel':
        return (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 sm:p-5">
            <p className="text-sm text-stone-300 leading-relaxed">{t('homeWhiteLabelInfo')}</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-stone-900 via-stone-800 to-stone-900 relative overflow-hidden">
      {/* Atmospheric background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        {/* Pink glow - top left */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px]" />
        {/* Cyan glow - bottom right */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px]" />
        {/* Purple accent - center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="p-6 flex justify-between items-center relative z-10">
        <Link href="/" className="flex flex-col">
          <span className="text-3xl font-bold text-stone-100 tracking-tight">Pulse</span>
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-widest -mt-1">Labs</span>
        </Link>
        <div className="flex items-center gap-4">
          <LanguageToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center p-6 relative z-10">
        <div className="text-center max-w-4xl w-full">
          {/* Pulse icon */}
          <div className="inline-flex items-center justify-center mb-6 mt-2">
            <svg className="w-28 h-28" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="24" stroke="url(#ripple1)" strokeWidth="2" fill="none" opacity="0.4" />
              <circle cx="32" cy="32" r="16" stroke="url(#ripple1)" strokeWidth="2.5" fill="none" opacity="0.6" />
              <circle cx="32" cy="32" r="8" stroke="url(#ripple1)" strokeWidth="3" fill="none" opacity="0.8" />
              <circle cx="32" cy="32" r="3" fill="url(#center1)" />
              <defs>
                <linearGradient id="center1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
                <linearGradient id="ripple1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-transparent bg-clip-text bg-linear-to-r from-stone-100 via-pink-100 to-stone-100">
            {t('homeHeadline')}
          </h1>

          <p className="text-xl text-stone-400 mb-8 font-light leading-relaxed max-w-2xl mx-auto">
            {t('homeSubheadline')}
            <br className="hidden sm:block" />
            {t('homeSubheadline2')}
          </p>

          {/* Target audience */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[t('homeForSM'), t('homeForAC'), t('homeForTL')].map((role) => (
              <span key={role} className="px-3 py-1 text-xs font-medium text-stone-400 border border-stone-700/40 rounded-full">
                {role}
              </span>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/teams"
            className="group relative inline-flex px-8 py-4 bg-linear-to-r from-pink-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-pink-900/30 hover:shadow-pink-500/30 hover:from-pink-500 hover:to-purple-500 transition-all duration-300 mb-12"
          >
            <span className="relative z-10 flex items-center gap-2">
              {t('homeGetStarted')}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>

          {/* Core Tools — interactive tiles with sliding info panels */}
          <div className="mb-12">
            <h2 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-6">{t('homeCoreTools')}</h2>
            <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 text-left sm:items-stretch">
              {/* Vibe Check */}
              <button
                onClick={() => toggleTool('vibe')}
                className={`mb-3 sm:mb-0 relative flex flex-col bg-stone-800/50 rounded-xl p-5 border text-left transition-all cursor-pointer ${
                  openTool === 'vibe'
                    ? 'border-pink-500/50 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500/20'
                    : 'border-stone-700/50 hover:border-cyan-500/30'
                }`}
              >
                {openTool === 'vibe' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-pink-500/50 hidden sm:block" />
                )}
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-200 mb-1">{t('homeVibeCheck')}</h3>
                <p className="text-sm text-stone-400 flex-1">{t('homeVibeCheckDesc')}</p>
              </button>
              {/* Mobile: Vibe info */}
              <div className="sm:hidden">
                <div className="accordion-content" data-open={openTool === 'vibe'}>
                  <div><div className="mb-3">{renderToolInfo('vibe')}</div></div>
                </div>
              </div>

              {/* Way of Work */}
              <button
                onClick={() => toggleTool('wow')}
                className={`mb-3 sm:mb-0 relative flex flex-col bg-stone-800/50 rounded-xl p-5 border text-left transition-all cursor-pointer ${
                  openTool === 'wow'
                    ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/20'
                    : 'border-stone-700/50 hover:border-cyan-500/30'
                }`}
              >
                {openTool === 'wow' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-cyan-500/50 hidden sm:block" />
                )}
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
                  <span className="text-cyan-400 font-bold">Δ</span>
                </div>
                <h3 className="font-semibold text-stone-200 mb-1">{t('homeWow')}</h3>
                <p className="text-sm text-stone-400 flex-1">{t('homeWowDesc')}</p>
              </button>
              {/* Mobile: WoW info */}
              <div className="sm:hidden">
                <div className="accordion-content" data-open={openTool === 'wow'}>
                  <div><div className="mb-3">{renderToolInfo('wow')}</div></div>
                </div>
              </div>

              {/* Team Feedback */}
              <button
                onClick={() => toggleTool('feedback')}
                className={`mb-3 sm:mb-0 relative flex flex-col bg-stone-800/50 rounded-xl p-5 border text-left transition-all cursor-pointer ${
                  openTool === 'feedback'
                    ? 'border-purple-500/50 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/20'
                    : 'border-stone-700/50 hover:border-purple-500/30'
                }`}
              >
                {openTool === 'feedback' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-purple-500/50 hidden sm:block" />
                )}
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-200 mb-1">{t('homeTeamFeedback')}</h3>
                <p className="text-sm text-stone-400 flex-1">{t('homeTeamFeedbackDesc')}</p>
              </button>
              {/* Mobile: Feedback info */}
              <div className="sm:hidden">
                <div className="accordion-content" data-open={openTool === 'feedback'}>
                  <div><div className="mb-3">{renderToolInfo('feedback')}</div></div>
                </div>
              </div>

              {/* Coach Questions */}
              <button
                onClick={() => toggleTool('coach')}
                className={`mb-3 sm:mb-0 relative flex flex-col bg-stone-800/50 rounded-xl p-5 border text-left transition-all cursor-pointer ${
                  openTool === 'coach'
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                    : 'border-stone-700/50 hover:border-emerald-500/30'
                }`}
              >
                {openTool === 'coach' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-emerald-500/50 hidden sm:block" />
                )}
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-200 mb-1">{t('homeCoachQuestions')}</h3>
                <p className="text-sm text-stone-400 flex-1">{t('homeCoachQuestionsDesc')}</p>
              </button>
              {/* Mobile: Coach info */}
              <div className="sm:hidden">
                <div className="accordion-content" data-open={openTool === 'coach'}>
                  <div><div className="mb-3">{renderToolInfo('coach')}</div></div>
                </div>
              </div>
            </div>

            {/* Desktop: shared info panel below the tile grid */}
            <div className="hidden sm:block">
              <div className="accordion-content mt-4" data-open={openTool !== null}>
                <div>{openTool && renderToolInfo(openTool)}</div>
              </div>
            </div>
          </div>

          {/* Coming Soon — interactive tiles with info panels */}
          <div className="mb-12">
            <h2 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-4">{t('homeComingSoon')}</h2>
            <div className="flex flex-col sm:grid sm:grid-cols-3 sm:gap-3 text-left">
              {/* Portfolio */}
              <button
                onClick={() => toggleComingSoon('portfolio')}
                className={`mb-3 sm:mb-0 relative flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                  openComingSoon === 'portfolio'
                    ? 'border-teal-500/50 bg-stone-800/80 ring-1 ring-teal-500/20'
                    : 'border-stone-700/30 bg-stone-800/40 hover:border-teal-500/30'
                }`}
              >
                {openComingSoon === 'portfolio' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-teal-500/50 hidden sm:block" />
                )}
                <svg className="w-4 h-4 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm text-stone-400 font-medium">{t('homePortfolio')}</span>
              </button>
              {/* Mobile: Portfolio info */}
              <div className="sm:hidden">
                <div className="accordion-content" data-open={openComingSoon === 'portfolio'}>
                  <div><div className="mb-3">{renderComingSoonInfo('portfolio')}</div></div>
                </div>
              </div>

              {/* Transition Support */}
              <button
                onClick={() => toggleComingSoon('transition')}
                className={`mb-3 sm:mb-0 relative flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                  openComingSoon === 'transition'
                    ? 'border-amber-500/50 bg-stone-800/80 ring-1 ring-amber-500/20'
                    : 'border-stone-700/30 bg-stone-800/40 hover:border-amber-500/30'
                }`}
              >
                {openComingSoon === 'transition' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-amber-500/50 hidden sm:block" />
                )}
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm text-stone-400 font-medium">{t('moduleTransition')}</span>
              </button>
              {/* Mobile: Transition info */}
              <div className="sm:hidden">
                <div className="accordion-content" data-open={openComingSoon === 'transition'}>
                  <div><div className="mb-3">{renderComingSoonInfo('transition')}</div></div>
                </div>
              </div>

              {/* White Label */}
              <button
                onClick={() => toggleComingSoon('whitelabel')}
                className={`mb-3 sm:mb-0 relative flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                  openComingSoon === 'whitelabel'
                    ? 'border-rose-500/50 bg-stone-800/80 ring-1 ring-rose-500/20'
                    : 'border-stone-700/30 bg-stone-800/40 hover:border-rose-500/30'
                }`}
              >
                {openComingSoon === 'whitelabel' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-rose-500/50 hidden sm:block" />
                )}
                <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span className="text-sm text-stone-400 font-medium">{t('moduleWhiteLabel')}</span>
              </button>
              {/* Mobile: White Label info */}
              <div className="sm:hidden">
                <div className="accordion-content" data-open={openComingSoon === 'whitelabel'}>
                  <div><div className="mb-3">{renderComingSoonInfo('whitelabel')}</div></div>
                </div>
              </div>
            </div>

            {/* Desktop: shared coming soon info panel */}
            <div className="hidden sm:block">
              <div className="accordion-content mt-3" data-open={openComingSoon !== null}>
                <div>{openComingSoon && renderComingSoonInfo(openComingSoon)}</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 italic mt-4">{t('homeComingSoonNote')}</p>
          </div>

          {/* Pricing — 100% transparent */}
          <div className="mb-12">
            <h2 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-2">{t('homePricing')}</h2>
            <p className="text-sm text-stone-400 mb-6">{t('homePricingSubtitle')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-left">
              {/* Free */}
              <button onClick={() => toggleTier('free')} className={`relative rounded-xl p-4 border text-left transition-all cursor-pointer flex flex-col ${
                openTier === 'free' ? 'border-stone-500/50 bg-stone-800/80 ring-1 ring-stone-500/20' : 'border-stone-700/50 bg-stone-800/50 hover:border-stone-600/50'
              }`}>
                {openTier === 'free' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-stone-500/50" />}
                <h3 className="text-sm font-bold text-stone-400">{t('tierFree')}</h3>
                <span className="text-xl font-bold text-stone-100 mt-1">{t('tierPriceFree')}</span>
                <span className="text-xs text-stone-400 mt-1">{t('tierTeams1')}</span>
              </button>

              {/* Scrum Master */}
              <button onClick={() => toggleTier('scrum_master')} className={`relative rounded-xl p-4 border text-left transition-all cursor-pointer flex flex-col ${
                openTier === 'scrum_master' ? 'border-cyan-500/50 bg-stone-800/80 ring-1 ring-cyan-500/20' : 'border-stone-700/50 bg-stone-800/50 hover:border-cyan-500/30'
              }`}>
                {openTier === 'scrum_master' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-cyan-500/50" />}
                <h3 className="text-sm font-bold text-cyan-400">{t('tierScrumMaster')}</h3>
                <div className="mt-1"><span className="text-xl font-bold text-stone-100">€9,99</span><span className="text-xs text-stone-400 ml-1">{t('tierPerMonth')}</span></div>
                <span className="text-xs text-stone-400 mt-1">{t('tierTeams3')}</span>
              </button>

              {/* Agile Coach */}
              <button onClick={() => toggleTier('agile_coach')} className={`relative rounded-xl p-4 border text-left transition-all cursor-pointer flex flex-col ${
                openTier === 'agile_coach' ? 'border-purple-500/50 bg-stone-800/80 ring-1 ring-purple-500/20' : 'border-stone-700/50 bg-stone-800/50 hover:border-purple-500/30'
              }`}>
                {openTier === 'agile_coach' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-purple-500/50" />}
                <h3 className="text-sm font-bold text-purple-400">{t('tierAgileCoach')}</h3>
                <div className="mt-1"><span className="text-xl font-bold text-stone-100">€24,99</span><span className="text-xs text-stone-400 ml-1">{t('tierPerMonth')}</span></div>
                <span className="text-xs text-stone-400 mt-1">{t('tierTeams10')}</span>
              </button>

              {/* Transition Coach */}
              <button onClick={() => toggleTier('transition_coach')} className={`relative rounded-xl p-4 border text-left transition-all cursor-pointer flex flex-col ${
                openTier === 'transition_coach' ? 'border-amber-500/50 bg-stone-800/80 ring-1 ring-amber-500/20' : 'border-stone-700/50 bg-stone-800/50 hover:border-amber-500/30'
              }`}>
                {openTier === 'transition_coach' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-amber-500/50" />}
                <h3 className="text-sm font-bold text-amber-400">{t('tierTransitionCoach')}</h3>
                <div className="mt-1"><span className="text-xl font-bold text-stone-100">€49,99</span><span className="text-xs text-stone-400 ml-1">{t('tierPerMonth')}</span></div>
                <span className="text-xs text-stone-400 mt-1">{t('tierTeams25')}</span>
              </button>

              {/* Enterprise */}
              <button onClick={() => toggleTier('enterprise')} className={`relative rounded-xl p-4 border text-left transition-all cursor-pointer flex flex-col col-span-2 sm:col-span-1 ${
                openTier === 'enterprise' ? 'border-rose-500/50 bg-stone-800/80 ring-1 ring-rose-500/20' : 'border-stone-700/50 bg-stone-800/50 hover:border-rose-500/30'
              }`}>
                {openTier === 'enterprise' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-rose-500/50" />}
                <h3 className="text-sm font-bold text-rose-400">{t('homeTierEnterprise')}</h3>
                <span className="text-xl font-bold text-stone-100 mt-1">{t('homeTierEnterprisePrice')}</span>
                <span className="text-xs text-stone-400 mt-1">{t('homeTierEnterpriseTeams')}</span>
              </button>
            </div>

            {/* Tier info panel — slides open below */}
            <div className="accordion-content mt-4" data-open={openTier !== null}>
              <div>
                {openTier === 'free' && (
                  <div className="rounded-xl border border-stone-600/30 bg-stone-800/60 p-5">
                    <p className="text-sm text-stone-300 leading-relaxed">{t('homeTierFreeInfo')}</p>
                    <Link href="/teams" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-stone-300 hover:text-stone-100 transition-colors">
                      {t('homeTryFree')}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </Link>
                  </div>
                )}
                {openTier === 'scrum_master' && (
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                    <p className="text-sm text-stone-300 leading-relaxed">{t('homeTierScrumMasterInfo')}</p>
                    <Link href="/teams" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                      {t('homeTryFree')}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </Link>
                  </div>
                )}
                {openTier === 'agile_coach' && (
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
                    <p className="text-sm text-stone-300 leading-relaxed">{t('homeTierAgileCoachInfo')}</p>
                    <Link href="/teams" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                      {t('homeTryFree')}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </Link>
                  </div>
                )}
                {openTier === 'transition_coach' && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                    <p className="text-sm text-stone-300 leading-relaxed">{t('homeTierTransitionCoachInfo')}</p>
                    <Link href="/teams" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors">
                      {t('homeTryFree')}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </Link>
                  </div>
                )}
                {openTier === 'enterprise' && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5">
                    <p className="text-sm text-stone-300 leading-relaxed">{t('homeTierEnterpriseInfo')}</p>
                    <Link href="/contact" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors">
                      {t('homeContactButton')}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback question */}
          <div className="mb-12 p-6 bg-linear-to-r from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20">
            <h3 className="text-lg font-semibold text-stone-200 mb-2">{t('homeWhatNext')}</h3>
            <p className="text-sm text-stone-400 mb-4">{t('homeWhatNextDesc')}</p>
            <a
              href="/backlog"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-sm font-medium transition-colors"
            >
              {t('homeLetUsKnow')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>

          {/* Contact CTA — hidden for now, keeping for later
          <div className="mb-12 p-6 bg-stone-800/50 rounded-2xl border border-stone-700/50">
            <h3 className="text-lg font-semibold text-stone-200 mb-2">{t('homeContactTitle')}</h3>
            <p className="text-sm text-stone-400 mb-4">{t('homeContactDesc')}</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-sm font-medium transition-colors"
            >
              {t('homeContactButton')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Link>
          </div>
          */}

          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-5 py-2.5 mt-4 bg-stone-700/50 hover:bg-stone-700 border border-stone-600/50 hover:border-stone-500 text-stone-300 hover:text-stone-100 rounded-lg text-sm font-medium transition-all"
          >
            {t('labLoginHint')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-6 pb-12 text-center relative z-10 space-y-3">
        <div className="flex justify-center gap-4 text-xs">
          <Link href="/terms" className="text-stone-500 hover:text-stone-300 transition-colors">{t('footerTerms')}</Link>
          <Link href="/privacy" className="text-stone-500 hover:text-stone-300 transition-colors">{t('footerPrivacy')}</Link>
          <Link href="/cookies" className="text-stone-500 hover:text-stone-300 transition-colors">{t('footerCookies')}</Link>
        </div>
        <p className="text-xs text-stone-500">
          <a
            href="https://pinkpollos.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-stone-300 transition-colors"
          >
            {t('pinkPollos')}
          </a>
          {' · '}{t('labFooter')}
        </p>
      </footer>
    </div>
  )
}
