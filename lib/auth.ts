import { SignJWT, jwtVerify } from 'jose'
import { timingSafeEqual } from 'crypto'

export const SESSION_COOKIE_NAME = 'docket-session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

export function verifyPassword(submitted: string): boolean {
  const expected = process.env.AUTH_PASSWORD
  if (!expected) return false
  if (submitted.length === 0) return false

  const a = Buffer.from(submitted, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function secretBytes(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export async function createSessionCookie(secret: string): Promise<string> {
  const token = await new SignJWT({ sub: 'docket-user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretBytes(secret))
  return token
}

export async function verifySessionCookie(token: string, secret: string): Promise<boolean> {
  if (!token) return false
  try {
    await jwtVerify(token, secretBytes(secret), { algorithms: ['HS256'] })
    return true
  } catch {
    return false
  }
}
