import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
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

describe('PATCH /api/projects/[id]', () => {
  it('updates project and returns 200', async () => {
    ;(prisma.project.update as MockedFn).mockResolvedValue({
      id: 'p1',
      name: 'Renamed',
      status: 'ACTIVE',
    })

    const req = new Request('http://localhost/api/projects/p1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed' }),
    })
    const res = await PATCH(req, ctx('p1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({ id: 'p1', name: 'Renamed' })
    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: { name: 'Renamed' },
      })
    )
  })

  it('returns 404 when project not found', async () => {
    ;(prisma.project.update as MockedFn).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: 'test',
      })
    )

    const req = new Request('http://localhost/api/projects/missing', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x' }),
    })
    const res = await PATCH(req, ctx('missing'))

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/projects/[id]', () => {
  it('returns 200 with { deleted: true }', async () => {
    ;(prisma.project.delete as MockedFn).mockResolvedValue({ id: 'p1' })

    const req = new Request('http://localhost/api/projects/p1', { method: 'DELETE' })
    const res = await DELETE(req, ctx('p1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ data: { deleted: true } })
  })

  it('returns 404 when project not found', async () => {
    ;(prisma.project.delete as MockedFn).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: 'test',
      })
    )

    const req = new Request('http://localhost/api/projects/missing', { method: 'DELETE' })
    const res = await DELETE(req, ctx('missing'))

    expect(res.status).toBe(404)
  })
})
