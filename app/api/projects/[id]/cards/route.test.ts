import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    card: {
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

function ctx(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/projects/[id]/cards', () => {
  it('returns cards ordered by column then position', async () => {
    ;(prisma.project.findUnique as MockedFn).mockResolvedValue({ id: 'p1' })
    const fake = [
      { id: 'c1', column: 'TODO', position: 'a0' },
      { id: 'c2', column: 'TODO', position: 'a1' },
    ]
    ;(prisma.card.findMany as MockedFn).mockResolvedValue(fake)

    const req = new Request('http://localhost/api/projects/p1/cards')
    const res = await GET(req, ctx('p1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ data: fake })
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'p1' },
        orderBy: [{ column: 'asc' }, { position: 'asc' }],
      })
    )
  })

  it('returns 404 when project not found', async () => {
    ;(prisma.project.findUnique as MockedFn).mockResolvedValue(null)

    const req = new Request('http://localhost/api/projects/missing/cards')
    const res = await GET(req, ctx('missing'))

    expect(res.status).toBe(404)
  })
})

describe('POST /api/projects/[id]/cards', () => {
  it('creates a card in the correct column and returns 201', async () => {
    ;(prisma.project.findUnique as MockedFn).mockResolvedValue({ id: 'p1' })
    ;(prisma.card.findFirst as MockedFn).mockResolvedValue({ position: 'a2' })
    ;(prisma.card.create as MockedFn).mockResolvedValue({
      id: 'c1',
      title: 'T',
      column: 'IN_PROGRESS',
      position: 'a3',
      projectId: 'p1',
    })

    const req = new Request('http://localhost/api/projects/p1/cards', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'T', column: 'IN_PROGRESS' }),
    })
    const res = await POST(req, ctx('p1'))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data).toMatchObject({ id: 'c1', column: 'IN_PROGRESS' })
    const callArg = (prisma.card.create as MockedFn).mock.calls[0][0]
    expect(callArg.data.column).toBe('IN_PROGRESS')
    expect(callArg.data.projectId).toBe('p1')
    expect(typeof callArg.data.position).toBe('string')
    expect(prisma.card.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'p1', column: 'IN_PROGRESS' },
        orderBy: { position: 'desc' },
      })
    )
  })

  it('returns 400 when title is missing', async () => {
    ;(prisma.project.findUnique as MockedFn).mockResolvedValue({ id: 'p1' })
    const req = new Request('http://localhost/api/projects/p1/cards', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ column: 'TODO' }),
    })
    const res = await POST(req, ctx('p1'))
    expect(res.status).toBe(400)
    expect(prisma.card.create).not.toHaveBeenCalled()
  })
})
