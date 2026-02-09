import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Public routes that do NOT require Clerk authentication
const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/sign-up(.*)',
  '/vibe/t/(.*)',
  '/d/(.*)',
  '/results/(.*)',
  '/participate/(.*)',
  '/api/auth/team(.*)',
  '/api/webhooks/(.*)',
  '/',
])

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl

  // Legacy redirects
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/')) {
    return NextResponse.redirect(new URL('/vibe/admin/teams', request.url))
  }
  if (pathname === '/admin/teams') {
    return NextResponse.redirect(new URL('/vibe/admin/teams', request.url))
  }
  if (pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (pathname.startsWith('/t/')) {
    const newPath = pathname.replace('/t/', '/vibe/t/')
    return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url))
  }
  if (pathname === '/feedback/backlog') {
    return NextResponse.redirect(new URL('/backlog', request.url))
  }

  // Redirect old login pages to unified login
  if (pathname === '/super-admin/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (pathname === '/vibe/admin/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
