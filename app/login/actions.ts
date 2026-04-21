'use server'

import { cookies } from 'next/headers'
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
  createSessionCookie,
} from '@/lib/auth'

export type LoginResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string }

function safeFrom(raw: string): string {
  if (!raw) return '/'
  if (!raw.startsWith('/')) return '/'
  if (raw.startsWith('//')) return '/'
  return raw
}

export async function login(password: string, from: string): Promise<LoginResult> {
  const secret = process.env.AUTH_SECRET
  if (!secret || !process.env.AUTH_PASSWORD) {
    return { success: false, error: 'SERVER AUTH NOT CONFIGURED' }
  }
  if (!verifyPassword(password)) {
    return { success: false, error: 'INVALID PASSWORD' }
  }

  const token = await createSessionCookie(secret)
  const jar = await cookies()
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  return { success: true, redirectTo: safeFrom(from) }
}
