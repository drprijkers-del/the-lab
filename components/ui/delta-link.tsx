'use client'

import { usePathname } from 'next/navigation'

/**
 * Floating link to Delta - visible on all Pulse pages.
 * Shows the connection between Pulse and Delta apps.
 */
export function DeltaLink() {
  const pathname = usePathname()

  // Don't show on super-admin pages
  if (pathname?.includes('/super-admin')) {
    return null
  }

  return (
    <a
      href="https://delta-app-khaki.vercel.app"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 left-4 flex items-center gap-2 px-4 py-2.5 min-h-11 bg-white border border-stone-200 rounded-full text-sm text-stone-600 hover:text-cyan-600 hover:border-cyan-300 shadow-sm hover:shadow active:shadow-none active:bg-stone-50 transition-all z-40"
    >
      <span className="text-cyan-500 font-bold">Δ</span>
      <span className="hidden sm:inline">Discover Delta</span>
      <span className="sm:hidden">Delta</span>
    </a>
  )
}
