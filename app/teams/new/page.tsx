import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'
import { AdminHeader } from '@/components/admin/header'
import { NewTeamForm } from '@/components/teams/new-team-form'
import { getTranslations } from '@/lib/i18n/server'

export default async function NewTeamPage() {
  const admin = await requireAdmin()
  const t = await getTranslations()

  return (
    <>
      <AdminHeader userEmail={admin.email} userName={admin.firstName} userRole={admin.role} />
      <main className="max-w-2xl mx-auto px-4 pt-8 pb-24">
        {/* Back link */}
        <Link
          href="/teams"
          className="inline-flex items-center text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 mb-6 min-h-11 py-2"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.adminBack}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t.teamsCreateTitle}</h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">{t.teamsCreateSubtitle}</p>
        </div>

        <NewTeamForm />
      </main>
    </>
  )
}
