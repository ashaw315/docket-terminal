import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProjectCreateModal } from './ProjectCreateModal'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

const originalFetch = globalThis.fetch

beforeEach(() => {
  globalThis.fetch = vi.fn() as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.clearAllMocks()
})

describe('ProjectCreateModal', () => {
  it('renders a name input and a submit button when open', () => {
    render(<ProjectCreateModal open onClose={() => {}} />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
  })

  it('disables submit when name is empty', () => {
    render(<ProjectCreateModal open onClose={() => {}} />)
    const submit = screen.getByRole('button', { name: /create/i })
    expect(submit).toBeDisabled()
  })

  it('calls POST /api/projects with correct payload on submit', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: { id: 'p1', name: 'Hello' } }),
    })

    render(<ProjectCreateModal open onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Hello' } })
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'note' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        })
      )
    })
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse((call[1] as RequestInit).body as string)
    expect(body).toMatchObject({ name: 'Hello', description: 'note' })
  })

  it('shows an error message when the API returns an error', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid request' }),
    })

    render(<ProjectCreateModal open onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Bad' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    expect(await screen.findByText(/invalid request|error|failed/i)).toBeInTheDocument()
  })

  it('clears the form when the modal is closed and reopened', () => {
    const { rerender } = render(<ProjectCreateModal open onClose={() => {}} />)
    const input = screen.getByLabelText(/name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Stale' } })
    expect(input.value).toBe('Stale')

    rerender(<ProjectCreateModal open={false} onClose={() => {}} />)
    rerender(<ProjectCreateModal open onClose={() => {}} />)

    const freshInput = screen.getByLabelText(/name/i) as HTMLInputElement
    expect(freshInput.value).toBe('')
  })
})
