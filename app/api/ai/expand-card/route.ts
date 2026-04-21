import { NextResponse } from 'next/server'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { CardColumn } from '@prisma/client'
import { SYSTEM_PROMPT, AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'

const ExpandCardSchema = z.object({
  cardId: z.string().min(1),
  cardTitle: z.string().min(1),
  cardNotes: z.string().optional(),
  column: z.nativeEnum(CardColumn),
  projectName: z.string().min(1),
  boardContext: z.object({
    TODO: z.array(z.string()),
    IN_PROGRESS: z.array(z.string()),
    DONE: z.array(z.string()),
  }),
})

function buildUserMessage(input: z.infer<typeof ExpandCardSchema>): string {
  const lines: string[] = []
  lines.push(`Project: ${input.projectName}`)
  lines.push(`Card to expand: ${input.cardTitle}`)
  if (input.cardNotes) lines.push(`Notes: ${input.cardNotes}`)
  lines.push(`Column: ${input.column}`)
  lines.push('Other cards on this board:')
  lines.push(`TODO: ${JSON.stringify(input.boardContext.TODO)}`)
  lines.push(`IN PROGRESS: ${JSON.stringify(input.boardContext.IN_PROGRESS)}`)
  lines.push(`DONE: ${JSON.stringify(input.boardContext.DONE)}`)
  lines.push('')
  lines.push('Return a JSON array of subtask title strings. Example:')
  lines.push('["Subtask one", "Subtask two", "Subtask three"]')
  return lines.join('\n')
}

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

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

export async function POST(req: Request): Promise<Response> {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ExpandCardSchema.safeParse(json)
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
      max_tokens: AI_MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(parsed.data) }],
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

  let suggestions: unknown
  try {
    suggestions = JSON.parse(stripFences(textBlock.text))
  } catch {
    return NextResponse.json({ error: 'AI_PARSE_ERROR' }, { status: 502 })
  }

  if (!isStringArray(suggestions)) {
    return NextResponse.json({ error: 'AI_PARSE_ERROR' }, { status: 502 })
  }

  return NextResponse.json({ data: { suggestions } }, { status: 200 })
}
