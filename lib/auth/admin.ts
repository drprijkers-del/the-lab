import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'

export interface AdminUser {
  id: string
  email: string
  role: 'super_admin' | 'scrum_master'
  firstName?: string | null
}

/**
 * Resolves a Clerk user to an admin_users row in Supabase.
 * - Fast path: lookup by clerk_user_id
 * - First login: lookup by email, then link clerk_user_id
 * - New user: auto-create as scrum_master
 */
async function resolveAdminUser(clerkUserId: string, email: string): Promise<AdminUser | null> {
  const supabase = await createAdminClient()

  // Fast path: lookup by clerk_user_id
  const { data: byClerkId } = await supabase
    .from('admin_users')
    .select('id, email, role')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (byClerkId) return byClerkId as AdminUser

  // First Clerk login: lookup by email and link
  const { data: byEmail } = await supabase
    .from('admin_users')
    .select('id, email, role')
    .eq('email', email.toLowerCase())
    .single()

  if (byEmail) {
    await supabase
      .from('admin_users')
      .update({ clerk_user_id: clerkUserId, last_login_at: new Date().toISOString() })
      .eq('id', byEmail.id)
    return byEmail as AdminUser
  }

  // New user: auto-create as scrum_master
  const { data: newUser, error } = await supabase
    .from('admin_users')
    .insert({
      email: email.toLowerCase(),
      role: 'scrum_master',
      clerk_user_id: clerkUserId,
      last_login_at: new Date().toISOString(),
    })
    .select('id, email, role')
    .single()

  if (error) return null
  return newUser as AdminUser
}

export async function requireAdmin(): Promise<AdminUser> {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  const user = await currentUser()
  if (!user?.emailAddresses?.[0]?.emailAddress) {
    redirect('/login')
  }

  const email = user.emailAddresses[0].emailAddress
  const adminUser = await resolveAdminUser(userId, email)

  if (!adminUser) {
    redirect('/login?error=unauthorized')
  }

  adminUser.firstName = user.firstName
  return adminUser
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  if (!user?.emailAddresses?.[0]?.emailAddress) return null

  const adminUser = await resolveAdminUser(userId, user.emailAddresses[0].emailAddress)
  if (adminUser) adminUser.firstName = user.firstName
  return adminUser
}

export async function getCurrentAdminId(): Promise<string | null> {
  const adminUser = await getAdminUser()
  return adminUser?.id || null
}

export async function isSuperAdmin(): Promise<boolean> {
  const adminUser = await getAdminUser()
  return adminUser?.role === 'super_admin'
}
