import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateKeyBetween } from 'fractional-indexing'
import { CardColumn } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const IngestSchema = z.object({
  project: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  tasks: z.array(
    z.object({
      title: z.string().min(1).max(255),
      column: z.enum(['todo', 'in_progress', 'done']).optional().default('todo'),
      notes: z.string().optional(),
      url: z.string().optional(),
    })
  ),
})

const columnMap: Record<'todo' | 'in_progress' | 'done', CardColumn> = {
  todo: CardColumn.TODO,
  in_progress: CardColumn.IN_PROGRESS,
  done: CardColumn.DONE,
}

export async function POST(req: Request): Promise<Response> {
  const expected = process.env.INGEST_TOKEN
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null
  if (!expected || !token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = IngestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { project: projectName, description, color, tasks } = parsed.data

  try {
    let project = await prisma.project.findFirst({
      where: { name: { equals: projectName, mode: 'insensitive' } },
      select: { id: true, name: true },
    })

    if (!project) {
      const lastProject = await prisma.project.findFirst({
        orderBy: { position: 'desc' },
        select: { position: true },
      })
      const position = generateKeyBetween(lastProject?.position ?? null, null)
      project = await prisma.project.create({
        data: { name: projectName, description, color, position },
        select: { id: true, name: true },
      })
    }

    const lastByColumn = new Map<CardColumn, string | null>()
    for (const col of Object.values(CardColumn)) {
      const last = await prisma.card.findFirst({
        where: { projectId: project.id, column: col },
        orderBy: { position: 'desc' },
        select: { position: true },
      })
      lastByColumn.set(col, last?.position ?? null)
    }

    const cardsData = tasks.map((t) => {
      const col = columnMap[t.column]
      const prev = lastByColumn.get(col) ?? null
      const position = generateKeyBetween(prev, null)
      lastByColumn.set(col, position)
      return {
        title: t.title,
        notes: t.notes,
        url: t.url || null,
        column: col,
        position,
        projectId: project.id,
      }
    })

    await prisma.card.createMany({ data: cardsData })

    return NextResponse.json(
      { data: { projectId: project.id, project: project.name, created: cardsData.length } },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
