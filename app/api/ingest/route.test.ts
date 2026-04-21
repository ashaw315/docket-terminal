import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    card: {
      findFirst: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

type MockedFn = ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  process.env.INGEST_TOKEN = 'secret-token'
})

async function loadPOST() {
  const mod = await import('./route')
  return mod.POST
}

function authHeaders(token?: string) {
  const h: Record<string, string> = { 'content-type': 'application/json' }
  if (token !== undefined) h['authorization'] = `Bearer ${token}`
  return h
}

describe('POST /api/ingest', () => {
  it('creates project and cards with valid payload, returns 201', async () => {
    ;(prisma.project.findFirst as MockedFn).mockResolvedValueOnce(null) // not found → create
    ;(prisma.project.findFirst as MockedFn).mockResolvedValueOnce({ position: 'a0' }) // last position lookup
    ;(prisma.project.create as MockedFn).mockResolvedValue({ id: 'p1', name: 'NewProj' })
    ;(prisma.card.findFirst as MockedFn).mockResolvedValue(null) // no existing cards in any column
    ;(prisma.card.createMany as MockedFn).mockResolvedValue({ count: 2 })

    const POST = await loadPOST()
    const req = new Request('http://localhost/api/ingest', {
      method: 'POST',
      headers: authHeaders('secret-token'),
      body: JSON.stringify({
        project: 'NewProj',
        tasks: [
          { title: 'One', column: 'todo' },
          { title: 'Two', column: 'done' },
        ],
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data).toMatchObject({ projectId: 'p1', project: 'NewProj', created: 2 })
    expect(prisma.card.createMany).toHaveBeenCalledTimes(1)
    const createManyArg = (prisma.card.createMany as MockedFn).mock.calls[0][0]
    expect(createManyArg.data).toHaveLength(2)
    const columns = createManyArg.data.map((c: { column: string }) => c.column)
    expect(columns).toEqual(['TODO', 'DONE'])
  })

  it('returns 401 when Authorization header is missing', async () => {
    const POST = await loadPOST()
    const req = new Request('http://localhost/api/ingest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ project: 'X', tasks: [{ title: 'y' }] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    expect(prisma.project.findFirst).not.toHaveBeenCalled()
  })

  it('returns 401 when Authorization header is wrong', async () => {
    const POST = await loadPOST()
    const req = new Request('http://localhost/api/ingest', {
      method: 'POST',
      headers: authHeaders('wrong'),
      body: JSON.stringify({ project: 'X', tasks: [{ title: 'y' }] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    expect(prisma.project.findFirst).not.toHaveBeenCalled()
  })

  it('returns 400 when body is missing project name', async () => {
    const POST = await loadPOST()
    const req = new Request('http://localhost/api/ingest', {
      method: 'POST',
      headers: authHeaders('secret-token'),
      body: JSON.stringify({ tasks: [{ title: 'y' }] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(prisma.project.findFirst).not.toHaveBeenCalled()
  })

  it('reuses an existing project (case-insensitive) rather than creating a duplicate', async () => {
    ;(prisma.project.findFirst as MockedFn).mockResolvedValueOnce({ id: 'p-existing', name: 'Existing' })
    ;(prisma.card.findFirst as MockedFn).mockResolvedValue(null)
    ;(prisma.card.createMany as MockedFn).mockResolvedValue({ count: 1 })

    const POST = await loadPOST()
    const req = new Request('http://localhost/api/ingest', {
      method: 'POST',
      headers: authHeaders('secret-token'),
      body: JSON.stringify({
        project: 'EXISTING',
        tasks: [{ title: 'One', column: 'todo' }],
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.projectId).toBe('p-existing')
    expect(prisma.project.create).not.toHaveBeenCalled()
  })
})
