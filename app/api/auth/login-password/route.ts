import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyPassword } from '@/lib/auth/password'

// Email aliases
const EMAIL_ALIASES: Record<string, string> = {
  'heisenberg@pinkpollos.com': 'dennis@pinkpollos.com',
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Resolve email alias
    const resolvedEmail = EMAIL_ALIASES[email.toLowerCase()] || email.toLowerCase()

    const supabase = await createAdminClient()

    // Find admin user with password
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('id, email, password_hash, role')
      .eq('email', resolvedEmail)
      .single()

    if (error || !adminUser) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!adminUser.password_hash) {
      return NextResponse.json(
        { error: 'No password set. Use magic link or contact admin.' },
        { status: 401 }
      )
    }

    // Verify password
    const validPassword = await verifyPassword(password, adminUser.password_hash)

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Sign in via Supabase Auth using admin API
    // We need to create a session - use signInWithPassword if the user exists in auth.users
    // Otherwise we use a custom session approach

    // Try to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: adminUser.email,
    })

    if (authError || !authData.properties?.hashed_token) {
      // Fallback: Create custom session cookie like super-admin
      const response = NextResponse.json({ success: true, redirect: '/admin/teams' })

      const sessionData = {
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        exp: Date.now() + 24 * 60 * 60 * 1000,
      }

      response.cookies.set('admin_password_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      })

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminUser.id)

      return response
    }

    // If we got here, use the magic link token to create session
    // This is complex, so let's use the simpler cookie approach
    const response = NextResponse.json({ success: true, redirect: '/admin/teams' })

    const sessionData = {
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }

    response.cookies.set('admin_password_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    })

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminUser.id)

    return response
  } catch (error) {
    console.error('Password login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
