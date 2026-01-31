import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Handle super-admin routes - require super admin session
  if (pathname.startsWith('/super-admin') && !pathname.startsWith('/super-admin/login')) {
    const sessionCookie = request.cookies.get('super_admin_session')?.value

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/super-admin/login', request.url))
    }

    try {
      const session = JSON.parse(sessionCookie)
      if (session.exp < Date.now()) {
        const response = NextResponse.redirect(new URL('/super-admin/login', request.url))
        response.cookies.delete('super_admin_session')
        return response
      }
    } catch {
      return NextResponse.redirect(new URL('/super-admin/login', request.url))
    }

    return NextResponse.next()
  }

  // Handle Pulse admin routes - require authentication
  if (pathname.startsWith('/pulse/admin') && !pathname.startsWith('/pulse/admin/login')) {
    // First check for password session cookie
    const passwordSession = request.cookies.get('admin_password_session')?.value
    if (passwordSession) {
      try {
        const session = JSON.parse(passwordSession)
        if (session.exp > Date.now()) {
          // Valid password session, allow through
          return NextResponse.next()
        }
      } catch {
        // Invalid session, continue to check Supabase session
      }
    }

    // Check Supabase session
    const { user, supabaseResponse } = await updateSession(request)

    if (!user) {
      const loginUrl = new URL('/pulse/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
  }

  // Handle unified /teams routes - require authentication
  if (pathname.startsWith('/teams')) {
    // First check for password session cookie
    const passwordSession = request.cookies.get('admin_password_session')?.value
    if (passwordSession) {
      try {
        const session = JSON.parse(passwordSession)
        if (session.exp > Date.now()) {
          return NextResponse.next()
        }
      } catch {
        // Invalid session, continue to check Supabase session
      }
    }

    // Check Supabase session
    const { user, supabaseResponse } = await updateSession(request)

    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
  }

  // Handle Delta routes - require authentication (except participation /d/)
  if (pathname.startsWith('/delta') && !pathname.startsWith('/d/')) {
    // First check for password session cookie
    const passwordSession = request.cookies.get('admin_password_session')?.value
    if (passwordSession) {
      try {
        const session = JSON.parse(passwordSession)
        if (session.exp > Date.now()) {
          return NextResponse.next()
        }
      } catch {
        // Invalid session, continue to check Supabase session
      }
    }

    // Check Supabase session
    const { user, supabaseResponse } = await updateSession(request)

    if (!user) {
      const loginUrl = new URL('/pulse/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
  }

  // Handle team invite links with token (Pulse)
  if (pathname.startsWith('/pulse/t/') && searchParams.has('k')) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // Handle Delta participation links
  if (pathname.startsWith('/d/')) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // Legacy redirects for old routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/')) {
    return NextResponse.redirect(new URL('/pulse/admin/teams', request.url))
  }
  if (pathname === '/admin/teams') {
    return NextResponse.redirect(new URL('/pulse/admin/teams', request.url))
  }
  if (pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/pulse/admin/login', request.url))
  }
  if (pathname.startsWith('/t/')) {
    const newPath = pathname.replace('/t/', '/pulse/t/')
    return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url))
  }
  if (pathname === '/feedback/backlog') {
    return NextResponse.redirect(new URL('/backlog', request.url))
  }

  // Default: update session for all other routes
  const { supabaseResponse } = await updateSession(request)
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
