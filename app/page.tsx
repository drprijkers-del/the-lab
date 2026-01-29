import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with subtle admin link */}
      <header className="p-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐔</span>
          <span className="text-sm font-medium text-stone-400">Pink Pollos</span>
        </div>
        <Link href="/admin/login" className="link-subtle hover:underline">
          Admin →
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-xl">
          {/* Tool badge */}
          <div className="inline-block tool-badge mb-6">
            Lab Tool
          </div>

          {/* Hero icon */}
          <div className="text-7xl mb-8 animate-bounce-gentle">
            📊
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold mb-4 tracking-tight">
            <span className="gradient-text">Mood Meter</span>
          </h1>

          <p className="text-xl text-stone-500 mb-4">
            Hoe voelt je team zich vandaag?
          </p>

          <p className="text-stone-400 mb-12 max-w-md mx-auto">
            Dagelijkse mood check-ins voor agile teams.
            Anoniem, snel en inzichtelijk.
          </p>

          {/* Features in a row */}
          <div className="flex justify-center gap-8 mb-12">
            <div className="flex items-center gap-2 text-stone-500">
              <span className="text-2xl">⚡</span>
              <span className="text-sm">1 klik</span>
            </div>
            <div className="flex items-center gap-2 text-stone-500">
              <span className="text-2xl">🔒</span>
              <span className="text-sm">Anoniem</span>
            </div>
            <div className="flex items-center gap-2 text-stone-500">
              <span className="text-2xl">🔥</span>
              <span className="text-sm">Streaks</span>
            </div>
          </div>

          {/* Mood preview */}
          <div className="flex justify-center gap-4 mb-8">
            {['😢', '😕', '😐', '🙂', '😄'].map((emoji, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-3xl hover:bg-pink-100 hover:scale-110 transition-all duration-200 cursor-default"
              >
                {emoji}
              </div>
            ))}
          </div>

          <p className="text-xs text-stone-400">
            Vraag je teamleider om een uitnodigingslink
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-xs text-stone-400">
          Een{' '}
          <a
            href="https://pinkpollos.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:text-pink-700"
          >
            Pink Pollos
          </a>
          {' '}Lab tool
        </p>
      </footer>
    </div>
  )
}
