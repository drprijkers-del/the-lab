'use client'

import { useLanguage } from '@/lib/i18n/context'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <button
      onClick={() => setLanguage(language === 'nl' ? 'en' : 'nl')}
      className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-11 min-w-11 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors text-sm font-medium text-stone-600"
      title={language === 'nl' ? 'Switch to English' : 'Naar Nederlands'}
      aria-label={language === 'nl' ? 'Switch to English' : 'Naar Nederlands'}
    >
      <span className={language === 'nl' ? 'opacity-100' : 'opacity-40'}>🇳🇱</span>
      <span className="text-stone-300">/</span>
      <span className={language === 'en' ? 'opacity-100' : 'opacity-40'}>🇬🇧</span>
    </button>
  )
}
