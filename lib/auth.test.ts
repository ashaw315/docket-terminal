// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import {
  verifyPassword,
  createSessionCookie,
  verifySessionCookie,
  SESSION_COOKIE_NAME,
} from './auth'

const TEST_PASSWORD = 'correct-horse'
const TEST_SECRET = '0123456789abcdef0123456789abcdef'

beforeEach(() => {
  process.env.AUTH_PASSWORD = TEST_PASSWORD
  process.env.AUTH_SECRET = TEST_SECRET
})

describe('SESSION_COOKIE_NAME', () => {
  it('is docket-session', () => {
    expect(SESSION_COOKIE_NAME).toBe('docket-session')
  })
})

describe('verifyPassword', () => {
  it('returns true for the correct password', () => {
    expect(verifyPassword(TEST_PASSWORD)).toBe(true)
  })

  it('returns false for a wrong password', () => {
    expect(verifyPassword('wrong')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(verifyPassword('')).toBe(false)
  })
})

describe('createSessionCookie / verifySessionCookie', () => {
  it('createSessionCookie returns a non-empty string', async () => {
    const token = await createSessionCookie(TEST_SECRET)
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })

  it('verifySessionCookie returns true for a cookie created by createSessionCookie', async () => {
    const token = await createSessionCookie(TEST_SECRET)
    expect(await verifySessionCookie(token, TEST_SECRET)).toBe(true)
  })

  it('verifySessionCookie returns false for a tampered token', async () => {
    const token = await createSessionCookie(TEST_SECRET)
    const tampered = token.slice(0, -4) + 'xxxx'
    expect(await verifySessionCookie(tampered, TEST_SECRET)).toBe(false)
  })

  it('verifySessionCookie returns false for an empty string', async () => {
    expect(await verifySessionCookie('', TEST_SECRET)).toBe(false)
  })

  it('verifySessionCookie returns false when signed with a different secret', async () => {
    const token = await createSessionCookie(TEST_SECRET)
    const other = 'ffffffffffffffffffffffffffffffff'
    expect(await verifySessionCookie(token, other)).toBe(false)
  })
})
