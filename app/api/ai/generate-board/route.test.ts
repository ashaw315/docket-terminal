// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const messagesCreateMock = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  class AnthropicMock {
    messages = { create: messagesCreateMock }
  }
  return { default: AnthropicMock }
})

async function loadPOST() {
  const mod = await import('./route')
  return mod.POST
}

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/ai/generate-board', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validPayload = {
  projectName: 'News to Sketch',
  description: 'Daily news scraper that produces a p5.js sketch per story',
  tasks: [
    { title: 'Scaffold Next.js app', column: 'done' },
    { title: 'Wire up Cloudflare R2 bucket', column: 'in_progress' },
    { title: 'Write Playwright tests', column: 'todo' },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.ANTHROPIC_API_KEY = 'test-key'
})

describe('POST /api/ai/generate-board', () => {
  it('returns 200 with projectName, description, and tasks for a valid request', async () => {
    messagesCreateMock.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(validPayload) }],
    })

    const POST = await loadPOST()
    const res = await POST(
      makeReq({
        description: 'A Next.js app that scrapes daily news and generates p5 sketches.',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({
      projectName: 'News to Sketch',
      description: validPayload.description,
    })
    expect(body.data.tasks).toHaveLength(3)
    expect(body.data.tasks[0]).toMatchObject({ title: 'Scaffold Next.js app', column: 'done' })

    expect(messagesCreateMock).toHaveBeenCalledTimes(1)
    const arg = messagesCreateMock.mock.calls[0][0]
    expect(arg.model).toBe('claude-sonnet-4-6')
    expect(arg.max_tokens).toBe(2048)
    expect(arg.system).toMatch(/task planning assistant/i)
  })

  it('strips ```json fences before parsing', async () => {
    messagesCreateMock.mockResolvedValue({
      content: [
        { type: 'text', text: '```json\n' + JSON.stringify(validPayload) + '\n```' },
      ],
    })
    const POST = await loadPOST()
    const res = await POST(
      makeReq({ description: 'Valid description with more than ten chars' })
    )
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.projectName).toBe('News to Sketch')
  })

  it('returns 400 when description is missing', async () => {
    const POST = await loadPOST()
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
    expect(messagesCreateMock).not.toHaveBeenCalled()
  })

  it('returns 400 when description is shorter than 10 characters', async () => {
    const POST = await loadPOST()
    const res = await POST(makeReq({ description: 'too short' }))
    expect(res.status).toBe(400)
    expect(messagesCreateMock).not.toHaveBeenCalled()
  })

  it('returns 503 when the Anthropic SDK throws', async () => {
    messagesCreateMock.mockRejectedValue(new Error('boom'))
    const POST = await loadPOST()
    const res = await POST(
      makeReq({ description: 'Valid description with more than ten chars' })
    )
    const body = await res.json()
    expect(res.status).toBe(503)
    expect(body.error).toBe('AI_UNAVAILABLE')
  })

  it('returns 502 when the response is not valid JSON', async () => {
    messagesCreateMock.mockResolvedValue({
      content: [{ type: 'text', text: 'I will think about it.' }],
    })
    const POST = await loadPOST()
    const res = await POST(
      makeReq({ description: 'Valid description with more than ten chars' })
    )
    const body = await res.json()
    expect(res.status).toBe(502)
    expect(body.error).toBe('AI_PARSE_ERROR')
  })

  it('returns 502 when the JSON is missing required fields', async () => {
    messagesCreateMock.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ projectName: 'x' }) }],
    })
    const POST = await loadPOST()
    const res = await POST(
      makeReq({ description: 'Valid description with more than ten chars' })
    )
    expect(res.status).toBe(502)
  })

  it('returns 502 when a task has an invalid column', async () => {
    messagesCreateMock.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            projectName: 'x',
            description: 'y',
            tasks: [{ title: 'a', column: 'BACKLOG' }],
          }),
        },
      ],
    })
    const POST = await loadPOST()
    const res = await POST(
      makeReq({ description: 'Valid description with more than ten chars' })
    )
    expect(res.status).toBe(502)
  })
})
