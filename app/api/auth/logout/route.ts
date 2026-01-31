import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    // Sign out from Supabase
    const supabase = await createClient()
    await supabase.auth.signOut()

    // Create response and clear the password session cookie
    const response = NextResponse.json({ success: true })

    response.cookies.delete('admin_password_session')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
