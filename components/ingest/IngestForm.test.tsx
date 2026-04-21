import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { IngestForm } from './IngestForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

const validPayload = JSON.stringify({
  project: 'Test Proj',
  tasks: [{ title: 'One', column: 'todo' }],
})

beforeEach(() => {
  vi.useRealTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('IngestForm', () => {
  it('renders a textarea and a submit button', () => {
    const action = vi.fn()
    render(<IngestForm pushToBoard={action} />)
    expect(screen.getByRole('textbox', { name: /ingest payload/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /push/i })).toBeInTheDocument()
  })

  it('disables submit when the textarea is empty', () => {
    const action = vi.fn()
    render(<IngestForm pushToBoard={action} />)
    expect(screen.getByRole('button', { name: /push/i })).toBeDisabled()
  })

  it('disables submit while the request is in-flight', async () => {
    let resolveAction: (v: { success: true; created: number; project: string }) => void = () => {}
    const action = vi.fn(
      () =>
        new Promise<{ success: true; created: number; project: string }>((res) => {
          resolveAction = res
        })
    )
    render(<IngestForm pushToBoard={action} />)

    fireEvent.change(screen.getByRole('textbox', { name: /ingest payload/i }), {
      target: { value: validPayload },
    })
    fireEvent.click(screen.getByRole('button', { name: /push/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /push/i })).toBeDisabled()
    })

    await act(async () => {
      resolveAction({ success: true, created: 1, project: 'Test Proj' })
    })
  })

  it('shows PUSHING… while loading', async () => {
    let resolveAction: (v: { success: true; created: number; project: string }) => void = () => {}
    const action = vi.fn(
      () =>
        new Promise<{ success: true; created: number; project: string }>((res) => {
          resolveAction = res
        })
    )
    render(<IngestForm pushToBoard={action} />)

    fireEvent.change(screen.getByRole('textbox', { name: /ingest payload/i }), {
      target: { value: validPayload },
    })
    fireEvent.click(screen.getByRole('button', { name: /push/i }))

    expect(await screen.findByText(/pushing/i)).toBeInTheDocument()

    await act(async () => {
      resolveAction({ success: true, created: 1, project: 'Test Proj' })
    })
  })

  it('shows a success message with task count and project name', async () => {
    const action = vi.fn().mockResolvedValue({ success: true, created: 3, project: 'Deep Work' })
    render(<IngestForm pushToBoard={action} />)

    fireEvent.change(screen.getByRole('textbox', { name: /ingest payload/i }), {
      target: { value: validPayload },
    })
    fireEvent.click(screen.getByRole('button', { name: /push/i }))

    expect(await screen.findByText(/3 TASKS ADDED TO DEEP WORK/i)).toBeInTheDocument()
  })

  it('shows an error on invalid JSON without calling the action', async () => {
    const action = vi.fn()
    render(<IngestForm pushToBoard={action} />)

    fireEvent.change(screen.getByRole('textbox', { name: /ingest payload/i }), {
      target: { value: 'not valid json' },
    })
    fireEvent.click(screen.getByRole('button', { name: /push/i }))

    expect(await screen.findByText(/INVALID JSON/i)).toBeInTheDocument()
    expect(action).not.toHaveBeenCalled()
  })

  it('shows an error message when the server action returns an error', async () => {
    const action = vi.fn().mockResolvedValue({ success: false, error: 'UNAUTHORIZED — CHECK INGEST TOKEN' })
    render(<IngestForm pushToBoard={action} />)

    fireEvent.change(screen.getByRole('textbox', { name: /ingest payload/i }), {
      target: { value: validPayload },
    })
    fireEvent.click(screen.getByRole('button', { name: /push/i }))

    expect(await screen.findByText(/UNAUTHORIZED — CHECK INGEST TOKEN/i)).toBeInTheDocument()
  })

  it('clears the textarea 3 seconds after a successful push', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const action = vi.fn().mockResolvedValue({ success: true, created: 1, project: 'Demo' })
    render(<IngestForm pushToBoard={action} />)

    const textarea = screen.getByRole('textbox', { name: /ingest payload/i }) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: validPayload } })
    fireEvent.click(screen.getByRole('button', { name: /push/i }))

    await waitFor(() => {
      expect(screen.getByText(/1 TASKS ADDED TO DEMO/i)).toBeInTheDocument()
    })
    expect(textarea.value).toBe(validPayload)

    await act(async () => {
      vi.advanceTimersByTime(3000)
      await Promise.resolve()
    })

    expect(textarea.value).toBe('')
  })
})
