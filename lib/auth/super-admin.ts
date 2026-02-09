import { redirect } from 'next/navigation'
import { requireAdmin, getAdminUser } from './admin'

export interface SuperAdminSession {
  userId: string
  email: string
  role: 'super_admin'
  exp: number
}

export async function requireSuperAdmin(): Promise<SuperAdminSession> {
  const adminUser = await requireAdmin()

  if (adminUser.role !== 'super_admin') {
    redirect('/login?error=unauthorized')
  }

  return {
    userId: adminUser.id,
    email: adminUser.email,
    role: 'super_admin',
    exp: Date.now() + 24 * 60 * 60 * 1000,
  }
}

export async function getSuperAdminSession(): Promise<SuperAdminSession | null> {
  const adminUser = await getAdminUser()
  if (!adminUser || adminUser.role !== 'super_admin') return null

  return {
    userId: adminUser.id,
    email: adminUser.email,
    role: 'super_admin',
    exp: Date.now() + 24 * 60 * 60 * 1000,
  }
}

export async function isSuperAdmin(): Promise<boolean> {
  const adminUser = await getAdminUser()
  return adminUser?.role === 'super_admin'
}
