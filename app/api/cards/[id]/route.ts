import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, CardColumn } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const UpdateCardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  notes: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  column: z.nativeEnum(CardColumn).optional(),
  position: z.string().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx): Promise<Response> {
  const { id } = await ctx.params

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = UpdateCardSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const card = await prisma.card.update({
      where: { id },
      data: parsed.data,
    })
    return NextResponse.json({ data: card }, { status: 200 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<Response> {
  const { id } = await ctx.params

  try {
    await prisma.card.delete({ where: { id } })
    return NextResponse.json({ data: { deleted: true } }, { status: 200 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
