import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface AdminUser {
  id: string
  email: string
  role: 'super_admin' | 'scrum_master'
}

// Check for password session cookie
async function getPasswordSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_password_session')?.value

  if (!sessionCookie) return null

  try {
    const session = JSON.parse(sessionCookie)
    if (session.exp < Date.now()) return null

    return {
      id: session.userId,
      email: session.email,
      role: session.role,
    }
  } catch {
    return null
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  // First check password session
  const passwordSession = await getPasswordSession()
  if (passwordSession) {
    return passwordSession
  }

  // Fall back to Supabase session
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/admin/login')
  }

  // Check if user is in admin_users table and get their info
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, email, role')
    .eq('email', user.email)
    .single()

  if (!adminUser) {
    redirect('/admin/login?error=unauthorized')
  }

  return adminUser as AdminUser
}

export async function getAdminUser(): Promise<AdminUser | null> {
  // First check password session
  const passwordSession = await getPasswordSession()
  if (passwordSession) {
    return passwordSession
  }

  // Fall back to Supabase session
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, email, role')
    .eq('email', user.email)
    .single()

  return adminUser as AdminUser | null
}

export async function getCurrentAdminId(): Promise<string | null> {
  const adminUser = await getAdminUser()
  return adminUser?.id || null
}

export async function isSuperAdmin(): Promise<boolean> {
  const adminUser = await getAdminUser()
  return adminUser?.role === 'super_admin'
}
