import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateKeyBetween } from 'fractional-indexing'
import { prisma } from '@/lib/prisma'
import { ProjectStatus } from '@prisma/client'

const StatusQuery = z.nativeEnum(ProjectStatus)

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().optional(),
})

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const raw = url.searchParams.get('status')
  const parsed = raw ? StatusQuery.safeParse(raw) : { success: true, data: ProjectStatus.ACTIVE } as const
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const status = parsed.data

  try {
    const projects = await prisma.project.findMany({
      where: { status },
      orderBy: { position: 'asc' },
      include: { _count: { select: { cards: true } } },
    })
    return NextResponse.json({ data: projects }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request): Promise<Response> {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateProjectSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const last = await prisma.project.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    const position = generateKeyBetween(last?.position ?? null, null)

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        color: parsed.data.color,
        position,
      },
    })
    return NextResponse.json({ data: project }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
