import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/pulse/admin/login?error=auth_failed', request.url))
    }

    // Get user
    const { data: { user } } = await supabase.auth.getUser()

    if (user?.email) {
      // Use admin client to bypass RLS for checking/creating user
      const adminSupabase = await createAdminClient()

      // Check if user exists in admin_users
      const { data: existingAdmin } = await adminSupabase
        .from('admin_users')
        .select('id, role')
        .eq('email', user.email)
        .single()

      if (!existingAdmin) {
        // Auto-create new scrum master
        const { error: insertError } = await adminSupabase
          .from('admin_users')
          .insert({
            email: user.email,
            role: 'scrum_master',
          })

        if (insertError) {
          console.error('Error creating admin user:', insertError)
          await supabase.auth.signOut()
          return NextResponse.redirect(new URL('/pulse/admin/login?error=registration_failed', request.url))
        }
      }

      // Update last login
      await adminSupabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('email', user.email)
    }
  }

  // Redirect to teams page on success
  return NextResponse.redirect(new URL('/teams', request.url))
}
