import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionCookie } from '@/lib/auth'

export const config = {
  matcher: ['/((?!login|api/auth|api/ingest|_next/static|_next/image|favicon.ico).*)'],
}

export async function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET
  if (!secret || !process.env.AUTH_PASSWORD) {
    return new NextResponse('Server auth not configured', { status: 500 })
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value ?? ''
  const ok = await verifySessionCookie(token, secret)
  if (ok) return NextResponse.next()

  const url = req.nextUrl.clone()
  const from = req.nextUrl.pathname + req.nextUrl.search
  url.pathname = '/login'
  url.search = `?from=${encodeURIComponent(from || '/')}`
  return NextResponse.redirect(url)
}
