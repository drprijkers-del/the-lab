'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/ui/language-toggle'

export function HomeContent() {
  const t = useTranslation()

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 relative overflow-hidden">
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
          <span className="text-2xl font-bold text-stone-100 tracking-tight">Pulse</span>
          <span className="text-[10px] font-medium text-stone-500 uppercase tracking-widest -mt-1">Labs</span>
        </Link>
        <div className="flex items-center gap-4">
          <LanguageToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center p-6 relative z-10">
        <div className="text-center max-w-4xl w-full">
          {/* Heart pulse icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/20 mb-8 mt-8">
            <span className="text-4xl text-pink-400">♥</span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-stone-100 via-pink-100 to-stone-100">
            Check Your Team&apos;s Pulse
          </h1>

          <p className="text-xl text-stone-400 mb-8 font-light leading-relaxed max-w-2xl mx-auto">
            Simple daily check-ins. Real-time team insights.
            <br className="hidden sm:block" />
            Know how your team is really doing.
          </p>

          {/* CTA */}
          <Link href="/teams">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-pink-900/30 hover:shadow-pink-500/30 hover:from-pink-500 hover:to-purple-500 transition-all duration-300 mb-12">
              <span className="relative z-10 flex items-center gap-2">
                {t('homeGetStarted')}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </Link>

          {/* Core Tools */}
          <div className="mb-12">
            <h2 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-6">Core Tools</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div className="bg-stone-800/50 rounded-xl p-5 border border-stone-700/50 hover:border-pink-500/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
                  <span className="text-pink-400 text-lg">♥</span>
                </div>
                <h3 className="font-semibold text-stone-200 mb-1">Vibe Check</h3>
                <p className="text-sm text-stone-400">Daily mood tracking with anonymous check-ins. See trends over time.</p>
              </div>
              <div className="bg-stone-800/50 rounded-xl p-5 border border-stone-700/50 hover:border-cyan-500/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
                  <span className="text-cyan-400 font-bold">Δ</span>
                </div>
                <h3 className="font-semibold text-stone-200 mb-1">Ceremonies</h3>
                <p className="text-sm text-stone-400">Deep-dive team health assessments. Shu-Ha-Ri progression system.</p>
              </div>
              <div className="bg-stone-800/50 rounded-xl p-5 border border-stone-700/50 hover:border-purple-500/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-200 mb-1">Team Feedback</h3>
                <p className="text-sm text-stone-400">Structured feedback tool with AI-powered conversation starters.</p>
              </div>
              <div className="bg-stone-800/50 rounded-xl p-5 border border-stone-700/50 hover:border-emerald-500/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-200 mb-1">Coach Questions</h3>
                <p className="text-sm text-stone-400">AI-generated coaching questions based on team data and context.</p>
              </div>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="mb-12">
            <h2 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-6">Coming Soon</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div className="bg-stone-800/30 rounded-xl p-5 border border-stone-700/30 opacity-70">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-blue-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-300 mb-1">Obeya</h3>
                <p className="text-sm text-stone-500">Visual management room for strategy alignment and team coordination.</p>
              </div>
              <div className="bg-stone-800/30 rounded-xl p-5 border border-stone-700/30 opacity-70">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-indigo-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-300 mb-1">Leadership</h3>
                <p className="text-sm text-stone-500">360-degree feedback and leadership development tracking.</p>
              </div>
              <div className="bg-stone-800/30 rounded-xl p-5 border border-stone-700/30 opacity-70">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-teal-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-300 mb-1">Portfolio</h3>
                <p className="text-sm text-stone-500">Multi-team health overview and cross-team insights dashboard.</p>
              </div>
              <div className="bg-stone-800/30 rounded-xl p-5 border border-stone-700/30 opacity-70">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-amber-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-300 mb-1">{t('moduleTransition')}</h3>
                <p className="text-sm text-stone-500">{t('moduleTransitionDesc')}</p>
              </div>
              <div className="bg-stone-800/30 rounded-xl p-5 border border-stone-700/30 opacity-70">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-rose-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-300 mb-1">{t('moduleWhiteLabel')}</h3>
                <p className="text-sm text-stone-500">{t('moduleWhiteLabelDesc')}</p>
              </div>
            </div>
          </div>

          {/* Feedback question */}
          <div className="mb-12 p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20">
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

          {/* Login hint */}
          <p className="text-sm text-stone-500">
            {t('labLoginHint')}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-6 pb-12 text-center relative z-10">
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
