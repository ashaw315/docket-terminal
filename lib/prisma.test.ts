import { describe, it, expect } from 'vitest'
import { prisma as prisma1 } from './prisma'
import { prisma as prisma2 } from './prisma'

describe('Prisma singleton', () => {
  it('returns the same instance on multiple imports', () => {
    expect(prisma1).toBe(prisma2)
  })
})
