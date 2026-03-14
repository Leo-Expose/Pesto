import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const { auth } = NextAuth(authConfig)

const PROTECTED_ROUTES = ['/new', '/my-pastes', '/settings', '/admin']

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Always allow static assets
  if (pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  // Protect /setup behind SETUP_MODE env var
  if (pathname.startsWith('/setup') || pathname.startsWith('/api/setup')) {
    if (process.env.SETUP_MODE !== 'true') {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // If DATABASE_URL is not configured and we don't have the setup_completed cookie
  if (!process.env.DATABASE_URL && !req.cookies.has('setup_completed')) {
    if (process.env.SETUP_MODE !== 'true') {
      return new NextResponse('Database is not configured. Please run "npm run setup" to configure Pesto.', { status: 503 })
    }

    if (pathname !== '/setup') {
      const url = req.nextUrl.clone()
      url.pathname = '/setup'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Standard auth protection
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtected && !req.auth) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Protect /admin routes specifically
  if (pathname.startsWith('/admin')) {
    if (req.auth?.user?.role !== 'admin') {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from /login
  if (pathname === '/login' && req.auth) {
    const redirectPath = req.nextUrl.searchParams.get('redirect') || '/new'
    return NextResponse.redirect(new URL(redirectPath, req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
