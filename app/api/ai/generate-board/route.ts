import { NextResponse } from 'next/server'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { GENERATE_BOARD_PROMPT, AI_MODEL, GENERATE_BOARD_MAX_TOKENS } from '@/lib/ai'

const RequestSchema = z.object({
  description: z.string().min(10).max(1000),
})

const GeneratedBoardSchema = z.object({
  projectName: z.string().min(1),
  description: z.string().min(1),
  tasks: z.array(
    z.object({
      title: z.string().min(1),
      column: z.enum(['todo', 'in_progress', 'done']),
    })
  ),
})

function stripFences(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/, '')
      .replace(/\s*```$/, '')
      .trim()
  }
  return trimmed
}

export async function POST(req: Request): Promise<Response> {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const client = new Anthropic()

  let response
  try {
    response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: GENERATE_BOARD_MAX_TOKENS,
      system: GENERATE_BOARD_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate a project board for the following:\n\n${parsed.data.description}`,
        },
      ],
    })
  } catch {
    return NextResponse.json({ error: 'AI_UNAVAILABLE' }, { status: 503 })
  }

  const textBlock = response.content.find(
    (b: { type: string }) => b.type === 'text'
  ) as { type: 'text'; text: string } | undefined

  if (!textBlock) {
    return NextResponse.json({ error: 'AI_PARSE_ERROR' }, { status: 502 })
  }

  let rawParsed: unknown
  try {
    rawParsed = JSON.parse(stripFences(textBlock.text))
  } catch {
    return NextResponse.json({ error: 'AI_PARSE_ERROR' }, { status: 502 })
  }

  const shapeCheck = GeneratedBoardSchema.safeParse(rawParsed)
  if (!shapeCheck.success) {
    return NextResponse.json({ error: 'AI_PARSE_ERROR' }, { status: 502 })
  }

  return NextResponse.json({ data: shapeCheck.data }, { status: 200 })
}
