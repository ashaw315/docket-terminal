import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET, POST } from './route'

type MockedFn = ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/projects', () => {
  it('returns projects filtered by status query param', async () => {
    const fake = [{ id: 'p1', name: 'A', status: 'ARCHIVED', position: 'a0', _count: { cards: 2 } }]
    ;(prisma.project.findMany as MockedFn).mockResolvedValue(fake)

    const req = new Request('http://localhost/api/projects?status=ARCHIVED')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ data: fake })
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ARCHIVED' },
        orderBy: { position: 'asc' },
        include: { _count: { select: { cards: true } } },
      })
    )
  })

  it('defaults to ACTIVE status when no param is provided', async () => {
    ;(prisma.project.findMany as MockedFn).mockResolvedValue([])

    const req = new Request('http://localhost/api/projects')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'ACTIVE' } })
    )
  })
})

describe('POST /api/projects', () => {
  it('creates a project and returns 201', async () => {
    ;(prisma.project.findFirst as MockedFn).mockResolvedValue({ position: 'a0' })
    ;(prisma.project.create as MockedFn).mockResolvedValue({
      id: 'p1',
      name: 'New',
      description: null,
      color: null,
      status: 'ACTIVE',
      position: 'a1',
    })

    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'New' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data).toMatchObject({ id: 'p1', name: 'New' })
    const callArg = (prisma.project.create as MockedFn).mock.calls[0][0]
    expect(callArg.data.name).toBe('New')
    expect(typeof callArg.data.position).toBe('string')
    expect(callArg.data.position).not.toBe('')
  })

  it('returns 400 when name is missing', async () => {
    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
    expect(prisma.project.create).not.toHaveBeenCalled()
  })

  it('returns 400 when name exceeds 255 chars', async () => {
    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'a'.repeat(256) }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(prisma.project.create).not.toHaveBeenCalled()
  })
})
