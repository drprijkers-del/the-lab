'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { Button } from '@/components/ui/button'

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
        {/* Green glow - top left */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-green-500/20 rounded-full blur-[100px]" />
        {/* Cyan glow - bottom right */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        {/* Yellow accent */}
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-yellow-400/5 rounded-full blur-[80px]" />
      </div>

      {/* Easter eggs */}
      <div className="absolute top-20 right-10 text-xs opacity-10 animate-pulse" style={{ animationDuration: '4s' }}>
        🪰
      </div>

      {/* Header */}
      <header className="p-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">🧪</span>
          <span className="text-lg font-bold text-stone-100">Pulse</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="text-center max-w-lg">
          {/* Lab flask with glow - links to super admin */}
          <Link
            href="/super-admin/login"
            className="inline-block text-7xl mb-8 hover:scale-110 transition-all duration-300 drop-shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:drop-shadow-[0_0_30px_rgba(34,197,94,0.6)]"
            title="Lab access"
          >
            🧪
          </Link>

          {/* Title with subtle glow */}
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100">
            {t('labTitle')}
          </h1>

          <p className="text-xl text-stone-400 mb-12 font-light">
            {t('labSubtitle')}
          </p>

          {/* CTA with lab-style button */}
          <Link href="/teams">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl font-semibold text-white shadow-lg shadow-green-900/30 hover:shadow-green-500/30 hover:from-green-500 hover:to-cyan-500 transition-all duration-300">
              <span className="relative z-10 flex items-center gap-2">
                Teams beheren
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </Link>

          {/* Features with neon-style dots */}
          <div className="flex flex-wrap justify-center gap-8 mt-14 mb-12">
            <div className="flex items-center gap-2 text-stone-400">
              <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
              <span className="text-sm">{t('labFeature1')}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></span>
              <span className="text-sm">{t('labFeature2')}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-400">
              <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></span>
              <span className="text-sm">{t('labFeature3')}</span>
            </div>
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
          <span className="ml-2 opacity-50 drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]" title="99.1% pure">⚗️</span>
        </p>
      </footer>
    </div>
  )
}
