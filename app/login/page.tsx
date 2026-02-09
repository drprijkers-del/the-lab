import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { LoginPageContent } from '@/components/admin/login-page-content'

export default async function LoginPage() {
  const { userId } = await auth()

  // Already signed in — redirect to teams
  if (userId) {
    redirect('/teams')
  }

  return <LoginPageContent />
}
