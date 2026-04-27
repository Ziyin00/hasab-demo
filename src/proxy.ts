import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // Define protected routes
  const isDashboardPage = pathname.startsWith('/dashboard')
  // Define auth routes
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')

  if (isDashboardPage) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      // Keep track of the page they were trying to access
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (isAuthPage) {
    if (token) {
      // If user is already logged in, redirect them to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/login', 
    '/register'
  ],
}
