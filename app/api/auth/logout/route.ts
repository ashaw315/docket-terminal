import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

export async function GET(req: NextRequest): Promise<Response> {
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  const res = NextResponse.redirect(url)
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
