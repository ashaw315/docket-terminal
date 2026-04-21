import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { GenerateBoardModal } from './GenerateBoardModal'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}))

const originalFetch = globalThis.fetch

beforeEach(() => {
  pushMock.mockClear()
  globalThis.fetch = vi.fn() as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.clearAllMocks()
})

type GenerateResult = {
  projectName: string
  description: string
  tasks: Array<{ title: string; column: 'todo' | 'in_progress' | 'done' }>
}

function makeGenerate(result: GenerateResult) {
  return vi.fn().mockResolvedValue(result)
}

describe('GenerateBoardModal — Stage 1', () => {
  it('renders a textarea and GENERATE button', () => {
    render(
      <GenerateBoardModal
        open
        onClose={() => {}}
        generate={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/describe your project/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^generate/i })).toBeInTheDocument()
  })

  it('GENERATE is disabled when the textarea has fewer than 10 characters', () => {
    render(
      <GenerateBoardModal
        open
        onClose={() => {}}
        generate={vi.fn()}
      />
    )
    const textarea = screen.getByLabelText(/describe your project/i)
    fireEvent.change(textarea, { target: { value: 'too short' } }) // 9 chars
    expect(screen.getByRole('button', { name: /^generate/i })).toBeDisabled()
  })

  it('GENERATE is disabled while loading and shows THINKING', async () => {
    let resolveGenerate: (v: GenerateResult) => void = () => {}
    const generate = vi.fn(
      () => new Promise<GenerateResult>((res) => { resolveGenerate = res })
    )

    render(
      <GenerateBoardModal
        open
        onClose={() => {}}
        generate={generate}
      />
    )

    fireEvent.change(screen.getByLabelText(/describe your project/i), {
      target: { value: 'Describe a valid long enough project' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^generate/i }))

    expect(await screen.findByText(/thinking/i)).toBeInTheDocument()

    await act(async () => {
      resolveGenerate({
        projectName: 'X',
        description: 'Y',
        tasks: [{ title: 'a', column: 'todo' }],
      })
    })
  })
})

describe('GenerateBoardModal — Stage 2 (preview)', () => {
  async function enterStage2(generate = makeGenerate({
    projectName: 'Proj',
    description: 'Summary',
    tasks: [
      { title: 'First', column: 'todo' },
      { title: 'Second', column: 'in_progress' },
      { title: 'Third', column: 'done' },
    ],
  })) {
    render(
      <GenerateBoardModal
        open
        onClose={() => {}}
        generate={generate}
      />
    )
    fireEvent.change(screen.getByLabelText(/describe your project/i), {
      target: { value: 'A valid project description of sufficient length.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^generate/i }))
    await screen.findByText('First')
  }

  it('transitions to Stage 2 with task list after a successful fetch', async () => {
    await enterStage2()
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Third')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /PROJ/i })).toBeInTheDocument()
  })

  it('all tasks are checked by default', async () => {
    await enterStage2()
    expect(screen.getByLabelText('First')).toBeChecked()
    expect(screen.getByLabelText('Second')).toBeChecked()
    expect(screen.getByLabelText('Third')).toBeChecked()
  })

  it('unchecked tasks are excluded from CREATE PROJECT call', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === '/api/projects') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { id: 'p1', name: 'Proj' } }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: { id: 'c1', title: 'x' } }),
      } as Response)
    })

    await enterStage2()
    fireEvent.click(screen.getByLabelText('Second')) // uncheck middle task
    fireEvent.click(screen.getByRole('button', { name: /^create project/i }))

    await waitFor(() => {
      const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls
      const cardCalls = calls.filter((c) => String(c[0]).includes('/cards'))
      expect(cardCalls).toHaveLength(2)
      const titles = cardCalls.map((c) => JSON.parse((c[1] as RequestInit).body as string).title)
      expect(titles).toEqual(['First', 'Third'])
    })
  })

  it('REGENERATE returns to Stage 1 with the description preserved', async () => {
    await enterStage2()
    fireEvent.click(screen.getByRole('button', { name: /regenerate/i }))

    const textarea = screen.getByLabelText(/describe your project/i) as HTMLTextAreaElement
    expect(textarea.value).toBe('A valid project description of sufficient length.')
  })

  it('shows an error state when generate fails', async () => {
    const generate = vi.fn().mockRejectedValue(new Error('boom'))
    render(
      <GenerateBoardModal
        open
        onClose={() => {}}
        generate={generate}
      />
    )
    fireEvent.change(screen.getByLabelText(/describe your project/i), {
      target: { value: 'A valid project description of sufficient length.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^generate/i }))

    expect(await screen.findByText(/could not generate|error/i)).toBeInTheDocument()
  })

  it('CREATE PROJECT creates the project then a card per selected task', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/projects' && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { id: 'p1', name: 'Proj' } }),
        } as Response)
      }
      if (String(url).startsWith('/api/projects/p1/cards') && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { id: 'c1' } }),
        } as Response)
      }
      return Promise.resolve({ ok: false } as Response)
    })

    await enterStage2()
    fireEvent.click(screen.getByRole('button', { name: /^create project/i }))

    await waitFor(() => {
      const calls = fetchMock.mock.calls
      const projectPost = calls.find((c) => c[0] === '/api/projects')
      expect(projectPost).toBeDefined()
      const cardCalls = calls.filter((c) => String(c[0]).includes('/cards'))
      expect(cardCalls).toHaveLength(3)
    })
  })

  it('navigates to /projects/[id] after successful creation', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/projects' && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { id: 'p-new', name: 'Proj' } }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: { id: 'c1' } }),
      } as Response)
    })

    await enterStage2()
    fireEvent.click(screen.getByRole('button', { name: /^create project/i }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/projects/p-new')
    })
  })
})
