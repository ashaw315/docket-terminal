import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Card } from '@/types'
import { CardDetailModal } from './CardDetailModal'

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

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    title: 'Existing title',
    notes: 'Existing notes',
    url: 'https://example.com',
    column: 'TODO',
    position: 'a0',
    projectId: 'p1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('CardDetailModal', () => {
  it('renders the title input populated with the current title', () => {
    render(
      <CardDetailModal
        card={makeCard()}
        open
        onClose={() => {}}
        onUpdated={() => {}}
        onDeleted={() => {}}
      />
    )
    expect(screen.getByLabelText(/title/i)).toHaveValue('Existing title')
  })

  it('renders the notes textarea populated with the current notes', () => {
    render(
      <CardDetailModal
        card={makeCard()}
        open
        onClose={() => {}}
        onUpdated={() => {}}
        onDeleted={() => {}}
      />
    )
    expect(screen.getByLabelText(/notes/i)).toHaveValue('Existing notes')
  })

  it('calls PATCH /api/cards/[id] on save with updated values', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'c1', title: 'Changed' } }),
    })

    const onUpdated = vi.fn()
    render(
      <CardDetailModal
        card={makeCard()}
        open
        onClose={() => {}}
        onUpdated={onUpdated}
        onDeleted={() => {}}
      />
    )

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Changed' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/cards/c1',
        expect.objectContaining({ method: 'PATCH' })
      )
    })
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse((call[1] as RequestInit).body as string)
    expect(body).toMatchObject({ title: 'Changed' })
    expect(onUpdated).toHaveBeenCalled()
  })

  it('calls DELETE /api/cards/[id] when delete is confirmed', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { deleted: true } }),
    })
    const onDeleted = vi.fn()
    render(
      <CardDetailModal
        card={makeCard()}
        open
        onClose={() => {}}
        onUpdated={() => {}}
        onDeleted={onDeleted}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/cards/c1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
    expect(onDeleted).toHaveBeenCalledWith('c1')
  })

  it('shows an error when the API returns an error on save', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid request' }),
    })

    render(
      <CardDetailModal
        card={makeCard()}
        open
        onClose={() => {}}
        onUpdated={() => {}}
        onDeleted={() => {}}
      />
    )

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(/invalid request|error|failed/i)).toBeInTheDocument()
  })
})
