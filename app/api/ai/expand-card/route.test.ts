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
  return new Request('http://localhost/api/ai/expand-card', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  cardId: 'c1',
  cardTitle: 'Build auth gate',
  cardNotes: 'password only, cookie session',
  column: 'TODO',
  projectName: 'Docket Terminal',
  boardContext: {
    TODO: ['Write spec'],
    IN_PROGRESS: [],
    DONE: [],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.ANTHROPIC_API_KEY = 'test-key'
})

describe('POST /api/ai/expand-card', () => {
  it('returns 200 with suggestions for a valid request', async () => {
    messagesCreateMock.mockResolvedValue({
      content: [
        { type: 'text', text: '["Add middleware", "Ship login page", "Set cookie"]' },
      ],
    })

    const POST = await loadPOST()
    const res = await POST(makeReq(validBody))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.suggestions).toEqual([
      'Add middleware',
      'Ship login page',
      'Set cookie',
    ])
    expect(messagesCreateMock).toHaveBeenCalledTimes(1)
    const arg = messagesCreateMock.mock.calls[0][0]
    expect(arg.model).toBe('claude-sonnet-4-6')
    expect(arg.max_tokens).toBe(1024)
    expect(arg.system).toMatch(/task planning assistant/)
  })

  it('strips ```json fences before parsing', async () => {
    messagesCreateMock.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: '```json\n["One", "Two"]\n```',
        },
      ],
    })
    const POST = await loadPOST()
    const res = await POST(makeReq(validBody))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.suggestions).toEqual(['One', 'Two'])
  })

  it('returns 400 when cardTitle is missing', async () => {
    const { cardTitle: _omit, ...bad } = validBody
    const POST = await loadPOST()
    const res = await POST(makeReq(bad))
    expect(res.status).toBe(400)
    expect(messagesCreateMock).not.toHaveBeenCalled()
  })

  it('returns 503 when the Anthropic SDK throws', async () => {
    messagesCreateMock.mockRejectedValue(new Error('boom'))
    const POST = await loadPOST()
    const res = await POST(makeReq(validBody))
    const body = await res.json()
    expect(res.status).toBe(503)
    expect(body.error).toBe('AI_UNAVAILABLE')
  })

  it('returns 502 when the response is not valid JSON', async () => {
    messagesCreateMock.mockResolvedValue({
      content: [{ type: 'text', text: 'I think you should probably foo the bar.' }],
    })
    const POST = await loadPOST()
    const res = await POST(makeReq(validBody))
    const body = await res.json()
    expect(res.status).toBe(502)
    expect(body.error).toBe('AI_PARSE_ERROR')
  })

  it('returns 502 when the JSON is not an array of strings', async () => {
    messagesCreateMock.mockResolvedValue({
      content: [{ type: 'text', text: '{"not": "an array"}' }],
    })
    const POST = await loadPOST()
    const res = await POST(makeReq(validBody))
    expect(res.status).toBe(502)
  })
})
