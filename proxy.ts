import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"
import { isSetupModeEnabled, isSetupRequestAllowed } from "@/lib/setupAccess"

const { auth } = NextAuth(authConfig)

const PROTECTED_ROUTES = ['/new', '/my-pastes', '/settings', '/admin']

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/setup') || pathname.startsWith('/api/setup')) {
    if (!isSetupModeEnabled()) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    if (!isSetupRequestAllowed(req)) {
      return new NextResponse(
        'Setup mode is only reachable from localhost or a private network unless SETUP_ALLOW_REMOTE=true is explicitly set.',
        { status: 403 }
      )
    }

    return NextResponse.next()
  }

  if (!process.env.DATABASE_URL && !req.cookies.has('setup_completed')) {
    if (!isSetupModeEnabled()) {
      return new NextResponse('Database is not configured. Please run "npm run setup" to configure Pesto.', { status: 503 })
    }

    if (pathname !== '/setup') {
      const url = req.nextUrl.clone()
      url.pathname = '/setup'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtected && !req.auth) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin')) {
    if (req.auth?.user?.role !== 'admin') {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

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
