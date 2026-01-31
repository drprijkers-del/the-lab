import { getBacklogItems, getReleaseNotes } from '@/domain/backlog/actions'
import { BacklogDisplay } from '@/components/backlog/backlog-display'

export const metadata = {
  title: 'Backlog | Pulse',
  description: 'What we\'re building and what we\'ve decided',
}

export default async function BacklogPage() {
  const [items, releases] = await Promise.all([
    getBacklogItems(),
    getReleaseNotes(),
  ])

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">Pulse Backlog</h1>
          <p className="text-stone-500 dark:text-stone-400">
            What we&apos;re exploring, building, and have decided against.
          </p>
        </header>

        <BacklogDisplay items={items} releases={releases} />
      </div>
    </div>
  )
}
