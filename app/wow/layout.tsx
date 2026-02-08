import { requireAdmin } from '@/lib/auth/admin'

export default async function DeltaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protect all /delta routes (except /d/ participation)
  await requireAdmin()

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {children}
    </div>
  )
}
