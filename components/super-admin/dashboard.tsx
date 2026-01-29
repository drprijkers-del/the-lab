'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: string
  email: string
  role: 'super_admin' | 'scrum_master'
  created_at: string
  last_login_at: string | null
}

interface Props {
  users: AdminUser[]
}

export function SuperAdminDashboard({ users: initialUsers }: Props) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(userId: string, email: string) {
    if (!confirm(`Delete user ${email}? Their teams and all data will also be deleted.`)) {
      return
    }

    setDeleting(userId)

    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch {
      alert('An error occurred')
    }

    setDeleting(null)
  }

  async function handleLogout() {
    await fetch('/api/auth/super-admin/logout', { method: 'POST' })
    router.push('/super-admin/login')
    router.refresh()
  }

  const scrumMasters = users.filter((u) => u.role === 'scrum_master')
  const superAdmins = users.filter((u) => u.role === 'super_admin')

  return (
    <div className="min-h-screen bg-stone-900 text-white">
      {/* Header */}
      <header className="border-b border-stone-700 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔐</span>
            <div>
              <span className="font-bold text-lg">Super Admin</span>
              <span className="text-stone-500 text-sm ml-2">Heisenberg Labs</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-3 min-h-11 text-sm text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
            aria-label="Log out of super admin"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-stone-800 border border-stone-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-cyan-400">{scrumMasters.length}</div>
            <div className="text-stone-400 text-sm">Scrum Masters</div>
          </div>
          <div className="bg-stone-800 border border-stone-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-cyan-400">{superAdmins.length}</div>
            <div className="text-stone-400 text-sm">Super Admins</div>
          </div>
        </div>

        {/* Users list */}
        <h2 className="text-xl font-bold mb-4">Admin Users</h2>

        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-stone-800 border border-stone-700 rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                <div className="font-medium flex items-center gap-2">
                  {user.email}
                  {user.role === 'super_admin' && (
                    <span className="text-xs bg-cyan-900 text-cyan-300 px-2 py-0.5 rounded-full">
                      super admin
                    </span>
                  )}
                </div>
                <div className="text-sm text-stone-500 mt-1">
                  Joined {new Date(user.created_at).toLocaleDateString('nl-NL')}
                  {user.last_login_at && (
                    <span className="ml-2">
                      · Last login {new Date(user.last_login_at).toLocaleDateString('nl-NL')}
                    </span>
                  )}
                </div>
              </div>

              {user.role !== 'super_admin' && (
                <button
                  onClick={() => handleDelete(user.id, user.email)}
                  disabled={deleting === user.id}
                  className="px-4 py-3 min-h-11 text-sm bg-red-900/50 hover:bg-red-900 text-red-300 rounded-lg transition-colors disabled:opacity-50"
                  aria-label={`Delete user ${user.email}`}
                >
                  {deleting === user.id ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center text-stone-500 py-8">No users found</div>
          )}
        </div>
      </main>
    </div>
  )
}
