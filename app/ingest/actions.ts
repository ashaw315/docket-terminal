'use server'

import { headers } from 'next/headers'

export type PushResult =
  | { success: true; created: number; project: string }
  | { success: false; error: string }

export async function pushToBoard(payload: string): Promise<PushResult> {
  try {
    JSON.parse(payload)
  } catch {
    return { success: false, error: 'INVALID JSON — CHECK YOUR PAYLOAD' }
  }

  const token = process.env.INGEST_TOKEN
  if (!token) {
    return { success: false, error: 'SERVER MISSING INGEST TOKEN' }
  }

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  if (!host) {
    return { success: false, error: 'PUSH FAILED — TRY AGAIN' }
  }
  const url = `${proto}://${host}/api/ingest`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: payload,
      cache: 'no-store',
    })
  } catch {
    return { success: false, error: 'PUSH FAILED — TRY AGAIN' }
  }

  if (res.status === 401) {
    return { success: false, error: 'UNAUTHORIZED — CHECK INGEST TOKEN' }
  }
  if (res.status === 400) {
    const body = await res.json().catch(() => ({}))
    const detail = typeof body?.error === 'string' ? body.error : 'INVALID PAYLOAD'
    return { success: false, error: `INVALID PAYLOAD — ${detail.toUpperCase()}` }
  }
  if (!res.ok) {
    return { success: false, error: 'PUSH FAILED — TRY AGAIN' }
  }

  const body = await res.json().catch(() => null)
  if (!body || !body.data || typeof body.data.created !== 'number' || typeof body.data.project !== 'string') {
    return { success: false, error: 'PUSH FAILED — TRY AGAIN' }
  }

  return {
    success: true,
    created: body.data.created,
    project: body.data.project,
  }
}
