import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: {
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { PATCH, DELETE } from './route'

type MockedFn = ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

function ctx(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('PATCH /api/cards/[id]', () => {
  it('updates card column and position (drag-and-drop case)', async () => {
    ;(prisma.card.update as MockedFn).mockResolvedValue({
      id: 'c1',
      column: 'DONE',
      position: 'b0',
    })

    const req = new Request('http://localhost/api/cards/c1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ column: 'DONE', position: 'b0' }),
    })
    const res = await PATCH(req, ctx('c1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({ id: 'c1', column: 'DONE', position: 'b0' })
    expect(prisma.card.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { column: 'DONE', position: 'b0' },
    })
  })

  it('returns 404 when card not found', async () => {
    ;(prisma.card.update as MockedFn).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: 'test',
      })
    )

    const req = new Request('http://localhost/api/cards/missing', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'x' }),
    })
    const res = await PATCH(req, ctx('missing'))
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/cards/[id]', () => {
  it('returns 200 with { deleted: true }', async () => {
    ;(prisma.card.delete as MockedFn).mockResolvedValue({ id: 'c1' })

    const req = new Request('http://localhost/api/cards/c1', { method: 'DELETE' })
    const res = await DELETE(req, ctx('c1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ data: { deleted: true } })
  })

  it('returns 404 when card not found', async () => {
    ;(prisma.card.delete as MockedFn).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: 'test',
      })
    )

    const req = new Request('http://localhost/api/cards/missing', { method: 'DELETE' })
    const res = await DELETE(req, ctx('missing'))
    expect(res.status).toBe(404)
  })
})
