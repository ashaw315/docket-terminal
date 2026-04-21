import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateKeyBetween } from 'fractional-indexing'
import { CardColumn } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const CreateCardSchema = z.object({
  title: z.string().min(1).max(255),
  notes: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  column: z.nativeEnum(CardColumn).default(CardColumn.TODO),
  position: z.string().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx): Promise<Response> {
  const { id } = await ctx.params

  try {
    const project = await prisma.project.findUnique({ where: { id }, select: { id: true } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const cards = await prisma.card.findMany({
      where: { projectId: id },
      orderBy: [{ column: 'asc' }, { position: 'asc' }],
    })
    return NextResponse.json({ data: cards }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request, ctx: Ctx): Promise<Response> {
  const { id } = await ctx.params

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateCardSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const project = await prisma.project.findUnique({ where: { id }, select: { id: true } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    let position = parsed.data.position
    if (!position) {
      const last = await prisma.card.findFirst({
        where: { projectId: id, column: parsed.data.column },
        orderBy: { position: 'desc' },
        select: { position: true },
      })
      position = generateKeyBetween(last?.position ?? null, null)
    }

    const card = await prisma.card.create({
      data: {
        title: parsed.data.title,
        notes: parsed.data.notes,
        url: parsed.data.url || null,
        column: parsed.data.column,
        position,
        projectId: id,
      },
    })
    return NextResponse.json({ data: card }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
